"use client";

import { SuccessModal } from "@/components/success-modal";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInvitationAction, createInvitedAdminAction } from "@/features/auth/server/actions";
import {
	createInvitedAdminSchema,
	type CreateInvitedAdminType,
} from "@/features/auth/schemas/accept-invite-schema";
import { useShowSuccess } from "@/hooks/use-show-success";
import { authClient } from "@/lib/better-auth/auth.client";
import { zodResolver } from "@hookform/resolvers/zod";
import { RiErrorWarningFill, RiEyeLine, RiEyeOffLine, RiInformationLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

export type AcceptInviteMode = "create-account" | "verify-email" | "accept" | "wrong-account";

type AcceptInviteClientProps = {
	email: string;
	invitationId: string;
	mode: AcceptInviteMode;
	organizationName: string;
};

export function AcceptInviteClient(props: AcceptInviteClientProps) {
	if (props.mode === "create-account") {
		return <CreateInvitedAdminForm {...props} />;
	}

	if (props.mode === "verify-email") {
		return <AwaitingEmailVerification email={props.email} />;
	}

	if (props.mode === "wrong-account") {
		return <SwitchAccountButton />;
	}

	return <AcceptInvitationButton {...props} />;
}

function CreateInvitedAdminForm({
	email,
	invitationId,
}: Pick<AcceptInviteClientProps, "email" | "invitationId">) {
	const router = useRouter();
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [accountSetupError, setAccountSetupError] = useState("");
	const [isCreatingAccount, startCreateAccountTransition] = useTransition();
	const { isSuccessModalOpen, setIsSuccessModalOpen } = useShowSuccess();
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<CreateInvitedAdminType>({
		resolver: zodResolver(createInvitedAdminSchema),
		defaultValues: { name: "", password: "" },
	});

	const onSubmit = (data: CreateInvitedAdminType) => {
		setAccountSetupError("");

		startCreateAccountTransition(async () => {
			try {
				const response = await createInvitedAdminAction(invitationId, data);

				if (response.status === "account-exists") {
					router.refresh();
					return;
				}

				if (response.status === "invalid" || response.status === "failed") {
					setAccountSetupError(response.error);
					return;
				}

				setIsSuccessModalOpen(true);
			} catch (error) {
				setAccountSetupError(
					error instanceof Error ? error.message : "Unable to create your account.",
				);
			}
		});
	};

	return (
		<>
			<form className="mt-12 text-gray-800" onSubmit={handleSubmit(onSubmit)} noValidate>
				<div className="mb-6">
					<Label htmlFor="name" className="mb-2 block text-sm">
						Name
					</Label>
					<Input
						id="name"
						placeholder="e.g., Sarah Thompson"
						{...register("name")}
						aria-describedby={errors.name ? "name-error" : undefined}
						aria-invalid={!!errors.name}
					/>
					{errors.name && (
						<p id="name-error" className="mt-2 text-sm font-medium text-red-500">
							{errors.name.message}
						</p>
					)}
				</div>

				<ReadOnlyEmailField email={email} />

				<div className="mt-6">
					<Label htmlFor="password" className="mb-2 block text-sm">
						Password
					</Label>
					<div className="relative">
						<Input
							id="password"
							type={isPasswordVisible ? "text" : "password"}
							placeholder="Enter a secure password"
							{...register("password")}
							aria-describedby={errors.password ? "password-error" : undefined}
							aria-invalid={!!errors.password}
						/>
						<PasswordVisibilityButton
							isPasswordVisible={isPasswordVisible}
							setIsPasswordVisible={setIsPasswordVisible}
						/>
					</div>
					{errors.password && (
						<p id="password-error" className="mt-2 text-sm font-medium text-red-500">
							{errors.password.message}
						</p>
					)}
				</div>

				<FormError message={accountSetupError} />

				<Button className="mt-16 w-full" type="submit" disabled={isSubmitting || isCreatingAccount}>
					{isCreatingAccount ? "Creating account..." : "Create account"}
				</Button>
			</form>

			{isSuccessModalOpen && (
				<SuccessModal
					isOpen={isSuccessModalOpen}
					setIsOpen={setIsSuccessModalOpen}
					heading="Verify Your Email"
					description={`We sent a verification link to ${email}. Open it to return and accept your administrator invitation.`}
				>
					<DialogFooter className="w-full text-sm">
						<Button className="h-9 w-full" onClick={() => setIsSuccessModalOpen(false)}>
							Got it
						</Button>
					</DialogFooter>
				</SuccessModal>
			)}
		</>
	);
}

function AwaitingEmailVerification({ email }: { email: string }) {
	return (
		<div className="mt-12 text-gray-800">
			<ReadOnlyEmailField email={email} />
			<p className="mt-6 text-center text-sm font-medium text-gray-600">
				You can close this page after opening the verification link in your email.
			</p>
		</div>
	);
}

function AcceptInvitationButton({
	invitationId,
	organizationName,
}: Pick<AcceptInviteClientProps, "invitationId" | "organizationName">) {
	const router = useRouter();
	const [acceptInvitationError, setAcceptInvitationError] = useState("");
	const [isAcceptingInvitation, startAcceptInvitationTransition] = useTransition();
	const { isSuccessModalOpen, setIsSuccessModalOpen } = useShowSuccess();

	const acceptInvitation = () => {
		setAcceptInvitationError("");

		startAcceptInvitationTransition(async () => {
			try {
				const response = await acceptInvitationAction(invitationId);

				if (response.status === "unauthorized") {
					router.refresh();
					return;
				}

				if (response.status === "invalid" || response.status === "failed") {
					setAcceptInvitationError(response.error);
					return;
				}

				setIsSuccessModalOpen(true);
			} catch (error) {
				setAcceptInvitationError(
					error instanceof Error ? error.message : "Unable to accept the invitation.",
				);
			}
		});
	};

	return (
		<>
			<FormError message={acceptInvitationError} />
			<Button
				className="mt-16 w-full"
				type="button"
				disabled={isAcceptingInvitation}
				onClick={acceptInvitation}
			>
				{isAcceptingInvitation ? "Accepting invitation..." : "Accept invitation"}
			</Button>

			{isSuccessModalOpen && (
				<SuccessModal
					isOpen={isSuccessModalOpen}
					setIsOpen={setIsSuccessModalOpen}
					heading="Account Setup Complete"
					description={`You are now an administrator for ${organizationName}.`}
				>
					<DialogFooter className="w-full text-sm">
						<Button className="h-9 w-full" onClick={() => router.push("/dashboard/overview")}>
							Continue to Dashboard
						</Button>
					</DialogFooter>
				</SuccessModal>
			)}
		</>
	);
}

function SwitchAccountButton() {
	const router = useRouter();
	const [switchAccountError, setSwitchAccountError] = useState("");
	const [isSwitchingAccount, startSwitchAccountTransition] = useTransition();

	const switchAccount = () => {
		setSwitchAccountError("");

		startSwitchAccountTransition(async () => {
			try {
				const { error } = await authClient.signOut();

				if (error) {
					setSwitchAccountError(error.message ?? "Unable to sign out.");
					return;
				}

				router.refresh();
			} catch (error) {
				setSwitchAccountError(error instanceof Error ? error.message : "Unable to sign out.");
			}
		});
	};

	return (
		<>
			<FormError message={switchAccountError} />
			<Button
				className="mt-16 w-full"
				type="button"
				disabled={isSwitchingAccount}
				onClick={switchAccount}
			>
				{isSwitchingAccount ? "Signing out..." : "Switch account"}
			</Button>
		</>
	);
}

function ReadOnlyEmailField({ email }: { email: string }) {
	return (
		<div>
			<Label htmlFor="email" className="mb-2 block text-sm">
				Email Address
			</Label>
			<Input id="email" type="email" value={email} readOnly aria-describedby="email-info" />
			<p id="email-info" className="mt-2 flex items-center gap-1">
				<RiInformationLine className="size-4 text-gray-400" aria-hidden="true" />
				<span className="text-sm text-gray-400">This email comes from your invitation</span>
			</p>
		</div>
	);
}

function PasswordVisibilityButton({
	isPasswordVisible,
	setIsPasswordVisible,
}: {
	isPasswordVisible: boolean;
	setIsPasswordVisible: (isVisible: boolean) => void;
}) {
	return (
		<button
			type="button"
			aria-label={isPasswordVisible ? "Hide password" : "Show password"}
			aria-pressed={isPasswordVisible}
			className="absolute right-4 top-1/2 -translate-y-1/2"
			onClick={() => setIsPasswordVisible(!isPasswordVisible)}
		>
			{isPasswordVisible ? (
				<RiEyeOffLine className="size-4 text-gray-600" aria-hidden="true" />
			) : (
				<RiEyeLine className="size-4 text-gray-600" aria-hidden="true" />
			)}
		</button>
	);
}

function FormError({ message }: { message: string }) {
	if (!message) {
		return null;
	}

	return (
		<div
			className="mt-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
			role="alert"
		>
			<RiErrorWarningFill className="size-4 shrink-0" aria-hidden="true" />
			<span>{message}</span>
		</div>
	);
}
