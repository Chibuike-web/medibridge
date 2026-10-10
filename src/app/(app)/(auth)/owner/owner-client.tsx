"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { ownerSchema, OwnerType } from "@/features/auth/schemas/owner-schema";
import {
	RiCheckboxCircleFill,
	RiErrorWarningFill,
	RiEyeLine,
	RiEyeOffLine,
	RiInformationLine,
} from "@remixicon/react";
import { authClient } from "@/lib/better-auth/auth.client";

type ResendFeedback = {
	type: "error" | "success";
	message: string;
};

export function OwnerClient() {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [signUpError, setSignUpError] = useState("");
	const [verificationEmailAddress, setVerificationEmailAddress] = useState<string | null>(null);
	const [resendFeedback, setResendFeedback] = useState<ResendFeedback | null>(null);
	const [isPending, startTransition] = useTransition();

	const {
		register,
		handleSubmit,
		setError,
		setFocus,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(ownerSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
	});

	async function onSubmit(data: OwnerType) {
		setSignUpError("");
		try {
			const { error } = await authClient.signUp.email({
				name: data.name,
				email: data.email,
				password: data.password,
				callbackURL: "/email-verified",
			});

			if (error?.status === 429) {
				setSignUpError("Too many attempts. Wait a moment and try again.");
				return;
			}

			if (error?.code === "USER_ALREADY_EXISTS") {
				setError("email", { message: "This email already has an account. Sign in instead." });
				return;
			}

			if (error) {
				setSignUpError(error.message ?? "Account creation failed");
				return;
			}

			setVerificationEmailAddress(data.email);
		} catch {
			setSignUpError("Account creation failed");
		}
	}

	function resendVerificationEmail(email: string) {
		setResendFeedback(null);
		startTransition(async () => {
			try {
				const { error } = await authClient.sendVerificationEmail({
					email,
					callbackURL: "/email-verified",
				});

				if (error?.status === 429) {
					setResendFeedback({
						type: "error",
						message: "Too many attempts. Wait a moment and try again.",
					});
					return;
				}

				if (error) {
					setResendFeedback({
						type: "error",
						message: "We couldn’t send a new link. Please try again.",
					});
					return;
				}

				setResendFeedback({ type: "success", message: `We sent a new link to ${email}.` });
			} catch {
				setResendFeedback({
					type: "error",
					message: "We couldn’t send a new link. Please try again.",
				});
			}
		});
	}

	function editEmailAddress() {
		// The email field must render before it can be focused.
		flushSync(() => {
			setVerificationEmailAddress(null);
			setResendFeedback(null);
		});
		setFocus("email");
	}

	if (verificationEmailAddress) {
		return (
			<div className="text-center">
				<div role="status">
					<h1 className="text-lg font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800 text-balance">
						Check your email
					</h1>
					<p className="text-gray-600 text-sm font-medium text-pretty mt-4">
						We sent a verification link to{" "}
						<span className="text-gray-800">{verificationEmailAddress}</span>. Open it to add your
						hospital details.
					</p>
				</div>

				<Button
					variant="outline"
					className="w-full mt-10"
					disabled={isPending}
					onClick={() => resendVerificationEmail(verificationEmailAddress)}
				>
					{isPending ? "Sending…" : "Resend link"}
				</Button>
				{resendFeedback?.type === "error" && (
					<div
						role="alert"
						className="mt-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-left text-sm font-medium text-red-700"
					>
						<RiErrorWarningFill className="size-4 shrink-0" aria-hidden="true" />
						<span>{resendFeedback.message}</span>
					</div>
				)}
				{resendFeedback?.type === "success" && (
					<div
						role="status"
						className="mt-4 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-left text-sm font-medium text-green-700"
					>
						<RiCheckboxCircleFill className="size-4 shrink-0" aria-hidden="true" />
						<span>{resendFeedback.message}</span>
					</div>
				)}

				<div className="mt-6 flex flex-col items-center gap-2 text-sm text-gray-600">
					<p>
						Wrong email?{" "}
						<Button
							type="button"
							variant="link"
							className="h-auto p-0 font-medium text-gray-800"
							onClick={editEmailAddress}
						>
							Go back
						</Button>
					</p>
					<p>
						Already verified?{" "}
						<Link
							href="/sign-in"
							className="font-medium text-gray-800 underline-offset-4 hover:underline"
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="mb-10">
				<h1 className="text-center text-lg font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800 text-balance">
					Owner Account Setup
				</h1>
				<p className="text-gray-600 text-sm font-medium text-center text-pretty mt-4">
					Set up the primary owner account for your hospital. This account will manage access and
					invite other members.
				</p>
			</div>
			<form onSubmit={handleSubmit(onSubmit)} className="text-gray-800 w-full">
				<div className="mb-6">
					<Label htmlFor="name" className="block mb-2 text-sm">
						Name
					</Label>
					<Input
						id="name"
						type="text"
						placeholder="eg., John Doe"
						{...register("name")}
						aria-describedby={errors.name ? "name-error" : undefined}
						aria-invalid={!!errors.name}
					/>
					{errors.name && (
						<p id="name-error" className="font-medium text-red-500 mt-2 text-sm">
							{errors.name.message}
						</p>
					)}
				</div>
				<div className="mb-6">
					<Label htmlFor="email" className="block mb-2 text-sm">
						Email
					</Label>
					<Input
						id="email"
						placeholder="sarah.thompson@stmaryhospital.org"
						type="email"
						{...register("email")}
						aria-describedby={errors.email ? "email-error" : "email-info"}
						aria-invalid={!!errors.email}
					/>
					{errors.email ? (
						<p id="email-error" className="font-medium text-red-500 mt-2 text-sm">
							{errors.email.message}
						</p>
					) : (
						<p id="email-info" className="flex gap-1 items-center mt-2">
							<RiInformationLine className="text-gray-400 size-4" aria-hidden="true" />
							<span className="text-sm text-gray-400">
								Must be official verified hospital email
							</span>
						</p>
					)}
				</div>

				<Label htmlFor="password" className="block mb-2 text-sm">
					Password
				</Label>
				<div className="relative">
					<Input
						id="password"
						type={isPasswordVisible ? "text" : "password"}
						placeholder="Enter a secure password"
						{...register("password")}
						aria-describedby={errors.password ? "password-error" : "password-requirement"}
						aria-invalid={!!errors.password}
					/>
					<Button
						variant="ghost"
						size="icon"
						type="button"
						aria-pressed={isPasswordVisible}
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
				{errors.password ? (
					<p id="password-error" className="font-medium text-red-500 mt-2 text-sm">
						{errors.password.message}
					</p>
				) : (
					<p id="password-requirement" className="mt-2 text-sm text-gray-400">
						Use 8 to 128 characters.
					</p>
				)}

				{signUpError && (
					<p className="mt-4 text-sm font-medium text-red-600" role="alert">
						{signUpError}
					</p>
				)}
				<Button className="w-full mt-16" type="submit" disabled={isSubmitting}>
					{isSubmitting ? "Creating account..." : "Continue"}
				</Button>
			</form>
		</>
	);
}
