"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/better-auth/auth.client";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";

type CreateNewPasswordClientProps = {
	token: string | null;
	isTokenInvalid: boolean;
};

type PasswordFeedback = {
	type: "error" | "success";
	message: string;
};

export function CreateNewPasswordClient({ token, isTokenInvalid }: CreateNewPasswordClientProps) {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [confirmedPassword, setConfirmedPassword] = useState("");
	const [passwordFeedback, setPasswordFeedback] = useState<PasswordFeedback | null>(null);
	const [isResetTokenRejected, setIsResetTokenRejected] = useState(false);
	const isPasswordMismatch =
		passwordFeedback?.type === "error" && passwordFeedback.message === "Passwords do not match.";
	const [isPending, startTransition] = useTransition();

	if (passwordFeedback?.type === "success") {
		return (
			<div className="flex w-full flex-col items-center">
				<Image src="/assets/verification-icon.svg" width={120} height={120} alt="" />
				<p className="mt-4 text-center text-sm font-medium text-gray-600">
					{passwordFeedback.message}
				</p>
				<Button asChild className="mt-16 w-full">
					<Link href="/sign-in">Continue to sign in</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="w-full">
			<h1 className="mt-10 text-center text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800 text-balance">
				Create a New Password
			</h1>
			<p className="mt-4 text-pretty text-center text-sm font-medium text-gray-600">
				Choose a strong password to keep your account secure.
			</p>
			{!token || isTokenInvalid || isResetTokenRejected ? (
				<div className="mt-12 text-center">
					<p role="alert" className="text-sm text-red-600">
						This password reset link is invalid or expired. Request a new one to continue.
					</p>
					<Button asChild className="mt-8 w-full">
						<Link href="/forgot-password">Request a new reset link</Link>
					</Button>
				</div>
			) : (
				<form
					onSubmit={(event) => {
						event.preventDefault();
						if (newPassword !== confirmedPassword) {
							setPasswordFeedback({ type: "error", message: "Passwords do not match." });
							return;
						}

						setPasswordFeedback(null);

						startTransition(async () => {
							try {
								const { error } = await authClient.resetPassword({ newPassword, token });

								if (error?.code === "INVALID_TOKEN" || error?.code === "TOKEN_EXPIRED") {
									setIsResetTokenRejected(true);
									return;
								}
								if (error) {
									setPasswordFeedback({
										type: "error",
										message:
											error.status === 429
												? "Too many attempts. Wait a moment and try again."
												: "We couldn’t reset your password. Please try again.",
									});
									return;
								}

								setPasswordFeedback({
									type: "success",
									message: "You have successfully created a new password",
								});
							} catch {
								setPasswordFeedback({
									type: "error",
									message: "We couldn’t reset your password. Please try again.",
								});
							}
						});
					}}
					aria-busy={isPending}
					className="text-gray-800 mt-12"
				>
					<div className="mb-6">
						<Label htmlFor="newPassword" className="block mb-2 text-sm">
							New Password
						</Label>
						<div className="relative">
							<Input
								id="newPassword"
								name="newPassword"
								type={isPasswordVisible ? "text" : "password"}
								autoComplete="new-password"
								minLength={8}
								maxLength={128}
								required
								disabled={isPending}
								value={newPassword}
								aria-describedby="password-requirement"
								placeholder="Enter new password"
								onChange={(event) => {
									setNewPassword(event.target.value);
									setPasswordFeedback(null);
								}}
							/>
							<Button
								variant="ghost"
								size="icon"
								type="button"
								aria-label={isPasswordVisible ? "Hide password" : "Show password"}
								aria-pressed={isPasswordVisible}
								className="absolute right-4 top-1/2 -translate-y-1/2 size-auto rounded-none border-0 hover:bg-transparent focus-visible:border-0"
								onClick={() => setIsPasswordVisible(!isPasswordVisible)}
							>
								{isPasswordVisible ? (
									<RiEyeOffLine className="size-4 text-gray-600" aria-hidden="true" />
								) : (
									<RiEyeLine className="size-4 text-gray-600" aria-hidden="true" />
								)}
							</Button>
						</div>
						<p id="password-requirement" className="mt-2 text-sm text-gray-400">
							Use 8 to 128 characters.
						</p>
					</div>
					<div className="mb-6">
						<Label htmlFor="confirmNewPassword" className="block mb-2 text-sm">
							Confirm New Password
						</Label>
						<div className="relative">
							<Input
								id="confirmNewPassword"
								name="confirmNewPassword"
								type={isConfirmPasswordVisible ? "text" : "password"}
								autoComplete="new-password"
								required
								disabled={isPending}
								value={confirmedPassword}
								aria-invalid={isPasswordMismatch}
								aria-describedby={isPasswordMismatch ? "password-mismatch" : undefined}
								placeholder="Confirm new password"
								onChange={(event) => {
									setConfirmedPassword(event.target.value);
									setPasswordFeedback(null);
								}}
							/>
							<Button
								variant="ghost"
								size="icon"
								type="button"
								aria-label={
									isConfirmPasswordVisible
										? "Hide confirmation password"
										: "Show confirmation password"
								}
								aria-pressed={isConfirmPasswordVisible}
								className="absolute right-4 top-1/2 -translate-y-1/2 size-auto rounded-none border-0 hover:bg-transparent focus-visible:border-0"
								onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
							>
								{isConfirmPasswordVisible ? (
									<RiEyeOffLine className="size-4 text-gray-600" aria-hidden="true" />
								) : (
									<RiEyeLine className="size-4 text-gray-600" aria-hidden="true" />
								)}
							</Button>
						</div>
						{isPasswordMismatch && (
							<p id="password-mismatch" role="alert" className="mt-2 text-sm text-red-600">
								{passwordFeedback?.message}
							</p>
						)}
					</div>
					{passwordFeedback?.type === "error" && !isPasswordMismatch && (
						<p role="alert" className="mb-4 text-sm text-amber-700">
							{passwordFeedback.message}
						</p>
					)}
					<Button className="mt-16 w-full" type="submit" disabled={isPending}>
						{isPending ? "Resetting password…" : "Reset Password"}
					</Button>
				</form>
			)}
		</div>
	);
}
