"use client";

import { getOrganizationAccessAction } from "@/features/auth/server/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema, SignInType } from "@/features/auth/schemas/sign-in-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { RiErrorWarningFill, RiEyeLine, RiEyeOffLine, RiInformationLine } from "@remixicon/react";
import { authClient } from "@/lib/better-auth/auth.client";
import { Route } from "next";

export function SignInClient() {
	const router = useRouter();
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [signInError, setSignInError] = useState("");
	const [isPending, startTransition] = useTransition();
	const searchParams = useSearchParams();
	const [hospitalChoices, setHospitalChoices] = useState<Array<{ id: string; name: string }>>([]);
	const [selectedHospitalId, setSelectedHospitalId] = useState("");
	const callbackUrl = searchParams.get("callbackUrl");
	const invitationCallbackUrl = callbackUrl?.startsWith("/accept-invite?invitationId=")
		? callbackUrl
		: null;

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<SignInType>({
		resolver: zodResolver(signInSchema),
	});

	const onSubmit = async (data: SignInType) => {
		setSignInError("");
		try {
			const { error } = await authClient.signIn.email({
				email: data.email,
				password: data.password,
				rememberMe: data.rememberMe,
			});

			if (error?.status === 429) {
				setSignInError("Too many sign-in attempts. Wait a moment and try again.");
				return;
			}

			if (error?.code === "EMAIL_NOT_VERIFIED") {
				const { error: sendVerificationEmailError } = await authClient.sendVerificationEmail({
					email: data.email,
					callbackURL: invitationCallbackUrl ?? "/email-verified",
				});

				setSignInError(
					sendVerificationEmailError
						? "Your email isn't verified yet, and we couldn't send a new link. Wait a moment and try again."
						: "Check your inbox for a verification link before signing in.",
				);
				return;
			}

			if (error) {
				setSignInError(error.message ?? "Unable to sign in. Please try again.");
				return;
			}
			if (invitationCallbackUrl) {
				router.replace(invitationCallbackUrl as Route);
				return;
			}
			const { data: organizations, error: listOrganizationsError } =
				await authClient.organization.list();

			if (listOrganizationsError) {
				setSignInError("Unable to load your hospitals. Please try again.");
				return;
			}

			if (!organizations || organizations.length === 0) {
				const { data: invitations, error: listInvitationsError } =
					await authClient.organization.listUserInvitations();
				if (listInvitationsError) {
					setSignInError("Unable to load your invitations. Please try again.");
					return;
				}
				const pendingInvitation = invitations?.find(
					(invitation) =>
						invitation.status === "pending" &&
						new Date(invitation.expiresAt).getTime() > Date.now(),
				);
				if (pendingInvitation) {
					router.replace(`/accept-invite?invitationId=${encodeURIComponent(pendingInvitation.id)}`);
					return;
				}
				router.replace("/hospital-details");
				return;
			}

			if (organizations.length > 1) {
				setHospitalChoices(organizations);
				setSelectedHospitalId(organizations[0].id);
				return;
			}

			const [organization] = organizations;
			await continueToHospital(organization.id);
		} catch {
			setSignInError("Unable to sign in. Please try again.");
		}
	};

	async function continueToHospital(organizationId: string) {
		const { error: setActiveOrganizationError } = await authClient.organization.setActive({
			organizationId,
		});

		if (setActiveOrganizationError) {
			setSignInError("Unable to select your hospital. Please try again.");
			return;
		}

		const organizationAccess = await getOrganizationAccessAction(organizationId);

		if (organizationAccess.status === "unauthorized") {
			setHospitalChoices([]);
			setSignInError("Your session expired. Please sign in again.");
			return;
		}

		if (organizationAccess.status === "forbidden") {
			setSignInError("You do not have access to this hospital organization.");
			return;
		}

		if (!organizationAccess.emailVerified || !organizationAccess.isOrganizationVerified) {
			router.replace("/verify");
			return;
		}
		startTransition(() => {
			router.replace(
				callbackUrl?.startsWith("/dashboard/") ? (callbackUrl as Route) : "/dashboard/overview",
			);
			reset();
		});
	}

	if (hospitalChoices.length > 1) {
		return (
			<form
				className="w-full text-gray-800"
				onSubmit={(event) => {
					event.preventDefault();
					setSignInError("");
					startTransition(async () => {
						try {
							await continueToHospital(selectedHospitalId);
						} catch {
							setSignInError("Unable to select your hospital. Please try again.");
						}
					});
				}}
			>
				<h1 className="text-center text-xl font-semibold">Choose your hospital</h1>
				<Label htmlFor="hospital" className="mt-8 mb-2 block text-sm">
					Hospital
				</Label>
				<select
					id="hospital"
					className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm"
					value={selectedHospitalId}
					disabled={isPending}
					onChange={(event) => setSelectedHospitalId(event.target.value)}
				>
					{hospitalChoices.map((hospital) => (
						<option key={hospital.id} value={hospital.id}>
							{hospital.name}
						</option>
					))}
				</select>
				{signInError && (
					<p role="alert" className="mt-4 text-sm text-red-600">
						{signInError}
					</p>
				)}
				<Button className="mt-8 w-full" disabled={isPending} type="submit">
					{isPending ? "Opening hospital..." : "Continue"}
				</Button>
			</form>
		);
	}

	return (
		<>
			<h1 className="mt-10 text-center text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800 text-balance">
				Welcome Back to MediBridge
			</h1>
			<p className="text-gray-600 text-sm font-medium text-center text-pretty mt-4">
				Sign in with your verified hospital credentials.
			</p>
			<form
				aria-describedby="sign-in-note"
				onSubmit={handleSubmit(onSubmit)}
				className="text-gray-800 mt-12"
			>
				<div className="mb-6">
					<Label htmlFor="adminEmail" className="block mb-2 text-sm">
						Email Address
					</Label>
					<Input
						id="adminEmail"
						type="email"
						placeholder="sarah.thompson@stmaryhospital.org"
						{...register("email")}
						aria-invalid={!!errors.email}
						aria-describedby={errors.email ? "email-error" : "email-info"}
					/>
					{errors.email && (
						<p id="email-error" className="font-medium text-red-500 mt-2 text-sm">
							{errors.email.message}
						</p>
					)}
					{!errors.email && (
						<p id="email-info" className="flex gap-1 items-center mt-2">
							<RiInformationLine className="text-gray-400 size-4" aria-hidden="true" />
							<span className="text-sm text-gray-400">
								Use the email you signed up or were invited with
							</span>
						</p>
					)}
				</div>
				<div className="mb-2">
					<Label htmlFor="password" className="block mb-2 text-sm">
						Password
					</Label>
					<div className="relative">
						<Input
							id="password"
							type={isPasswordVisible ? "text" : "password"}
							placeholder="Enter new password"
							{...register("password")}
							aria-describedby={errors.password ? "admin-password-error" : undefined}
							aria-invalid={!!errors.password}
						/>
						<Button
							variant="ghost"
							size="icon"
							type="button"
							aria-label={isPasswordVisible ? "Hide password" : "Show password"}
							className="absolute right-4 top-1/2 -translate-y-1/2 size-auto rounded-none border-0 hover:bg-transparent focus-visible:border-0"
							onClick={() => setIsPasswordVisible(!isPasswordVisible)}
						>
							<span aria-hidden="true">
								{isPasswordVisible ? (
									<RiEyeOffLine className="size-4 text-gray-600" />
								) : (
									<RiEyeLine className="size-4 text-gray-600" />
								)}
							</span>
						</Button>
					</div>
					{errors.password && (
						<p id="admin-password-error" className="font-medium text-red-500 mt-1 text-sm">
							{errors.password.message}
						</p>
					)}
				</div>
				<div className="flex items-center justify-between mb-4 text-sm">
					<Controller
						name="rememberMe"
						control={control}
						defaultValue={false}
						render={({ field }) => (
							<Label className="cursor-pointer">
								<Checkbox checked={field.value} onCheckedChange={field.onChange} />
								Remember me
							</Label>
						)}
					/>

					<Link href="/forgot-password" className="font-medium text-sm">
						Forgot Password
					</Link>
				</div>

				<p id="sign-in-note" className="text-sm">
					Use your verified hospital credentials. Access is monitored for compliance and security.
				</p>

				{signInError && (
					<div
						role="alert"
						className="mt-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
					>
						<span className="shrink-0">
							<RiErrorWarningFill className="size-4" aria-hidden="true" />
						</span>
						<span>{signInError}</span>
					</div>
				)}

				<Button className="w-full mt-16" type="submit" disabled={isSubmitting || isPending}>
					{isSubmitting ? (
						<span className="flex items-center gap-2">
							<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							Signing in...
						</span>
					) : (
						"Sign in"
					)}
				</Button>
			</form>
			<p className="text-center mt-4 text-sm font-medium">
				<span className="text-gray-600">Do not have an account? </span>
				<Link href="/owner" className="font-medium underline underline-offset-3 text-gray-800">
					Create an account
				</Link>
			</p>
		</>
	);
}
