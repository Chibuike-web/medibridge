"use client";

import { useState } from "react";
import Link from "next/link";
import { RiEyeLine, RiEyeOffLine, RiMacbookLine } from "@remixicon/react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

import type { ChangePasswordView, SettingsSubView } from "./types";

export function AccountSettings({
	activeSettingsSubView,
	changePasswordView,
	onChangePasswordView,
	onSettingsSubViewChange,
}: {
	activeSettingsSubView: SettingsSubView | null;
	changePasswordView: ChangePasswordView;
	onChangePasswordView: (view: ChangePasswordView) => void;
	onSettingsSubViewChange: (view: SettingsSubView | null) => void;
}) {
	const handleSettingsSubViewChange = (view: SettingsSubView | null) => {
		if (view === "change-password") {
			onChangePasswordView("change-password");
		}

		onSettingsSubViewChange(view);
	};

	if (activeSettingsSubView === "organization") {
		return (
			<div className="flex flex-col gap-6 px-6 pt-4">
				<section aria-labelledby="organization-details-heading">
					<dl className="mt-2">
						<div className="flex h-16 items-center justify-between gap-4 border-b">
							<dt className="text-sm font-medium text-gray-600">Organization name</dt>
							<dd className="truncate text-sm font-semibold text-gray-800">
								Medicare General Hospital
							</dd>
						</div>

						<div className="flex h-16 items-center justify-between gap-4 border-b">
							<dt className="text-sm font-medium text-gray-600">Verification status</dt>
							<dd>
								<StatusBadge className="text-sm" status="Verified" />
							</dd>
						</div>
						<div className="flex h-16 items-center justify-between gap-4 border-b">
							<dt className="text-sm font-medium text-gray-600">Organization ID</dt>
							<dd className="text-sm font-semibold text-gray-800">MGMH-XXXX</dd>
						</div>
					</dl>
				</section>
			</div>
		);
	}

	if (activeSettingsSubView === "change-password") {
		switch (changePasswordView) {
			case "change-password":
				return (
					<CurrentPasswordStep onContinue={() => onChangePasswordView("verify-your-identity")} />
				);
			case "verify-your-identity":
				return <VerifyIdentityStep onContinue={() => onChangePasswordView("enter-new-password")} />;
			case "enter-new-password":
				return <EnterNewPasswordStep />;
			default:
				return null;
		}
	}

	if (activeSettingsSubView === "active-session") {
		return <ActiveSession />;
	}

	return (
		<div className="flex h-full flex-col gap-6 px-6 py-4">
			<section aria-labelledby="organization-settings-heading">
				<h3 id="organization-settings-heading" className="font-semibold">
					Organization
				</h3>
				<dl>
					<div className="flex h-16 items-center justify-between gap-4 border-b">
						<div className="flex min-w-0 flex-col gap-1">
							<dt className="text-sm font-medium text-gray-400">Organization name</dt>
							<dd className="truncate text-sm font-semibold text-gray-600">
								Medicare General Hospital
							</dd>
						</div>
						<dd className="shrink-0 self-center">
							<Button
								type="button"
								className="text-sm font-medium text-gray-400"
								variant="ghost"
								aria-label="View organization details"
								onClick={() => onSettingsSubViewChange("organization")}
							>
								View
							</Button>
						</dd>
					</div>
				</dl>
			</section>
			<section aria-labelledby="account-security-heading">
				<h3 id="account-security-heading" className="font-semibold">
					Account security
				</h3>
				<dl>
					<div className="flex h-16 items-center justify-between gap-4">
						<div className="flex min-w-0 flex-col gap-1">
							<dt className="text-sm font-medium text-gray-400">Password</dt>
							<dd className="text-sm font-semibold text-gray-600">************</dd>
						</div>
						<dd className="shrink-0 self-center">
							<Button
								type="button"
								className="text-sm font-medium text-gray-400"
								variant="ghost"
								aria-label="Change password"
								onClick={() => handleSettingsSubViewChange("change-password")}
							>
								Change
							</Button>
						</dd>
					</div>
					<div className="flex h-16 items-center justify-between gap-4 border-b">
						<div className="flex min-w-0 flex-col gap-1">
							<dt className="text-sm font-medium text-gray-400">Active session</dt>
							<dd className="truncate text-sm font-semibold text-gray-600">
								3 devices currently signed in
							</dd>
						</div>
						<dd className="shrink-0 self-center">
							<Button
								type="button"
								className="text-sm font-medium text-gray-400"
								variant="ghost"
								aria-label="View active sessions"
								onClick={() => onSettingsSubViewChange("active-session")}
							>
								View
							</Button>
						</dd>
					</div>
				</dl>
			</section>
			<section aria-labelledby="danger-zone-heading" className="flex items-center justify-between">
				<div className="flex flex-col gap-[6px]">
					<h3 id="danger-zone-heading" className="font-semibold text-destructive">
						Danger zone
					</h3>
					<p className="w-full max-w-[400px] text-sm text-gray-600">
						Deleting an account is permanent and may require transferring organization ownership
						first
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					className="border-destructive text-sm text-destructive hover:bg-red-50 hover:text-red-700"
				>
					Delete account
				</Button>
			</section>
		</div>
	);
}

function CurrentPasswordStep({ onContinue }: { onContinue: () => void }) {
	return (
		<div className="flex h-full flex-col gap-12 p-6">
			<section aria-labelledby="current-password-heading" className="flex flex-col gap-3">
				<div className="flex items-center justify-between gap-4">
					<Label
						htmlFor="current-password"
						id="current-password-heading"
						className="text-sm font-medium text-gray-600"
					>
						Current password <span className="font-normal text-gray-400">(required)</span>
					</Label>
					<Link
						href="/forgot-password"
						className="shrink-0 text-sm font-medium text-gray-600 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100"
					>
						Forgot password
					</Link>
				</div>
				<Input
					id="current-password"
					name="currentPassword"
					type="password"
					placeholder="Enter current password"
					autoComplete="current-password"
					required
				/>
			</section>
			<Button type="button" className="self-end text-sm" onClick={onContinue}>
				Continue
			</Button>
		</div>
	);
}

function VerifyIdentityStep({ onContinue }: { onContinue: () => void }) {
	const [enteredVerificationCode, setEnteredVerificationCode] = useState("");

	return (
		<div className="flex h-full flex-col gap-12 p-6">
			<section aria-labelledby="verification-code-heading" className="items-center text-center">
				<h3 id="verification-code-heading" className="text-[18px] font-semibold text-gray-800">
					Verify your identity
				</h3>
				<p className="mt-4 text-balance text-sm font-medium text-gray-600">
					For your security, verify your identity before changing your password. We sent a 6-digit
					code to a••••••@medicaregeneralhospital.org.
				</p>

				<InputOTP
					id="verification-code"
					maxLength={6}
					value={enteredVerificationCode}
					onChange={setEnteredVerificationCode}
					aria-labelledby="verification-code-heading"
					containerClassName="mt-6 justify-center"
				>
					<InputOTPGroup className="gap-6">
						{Array.from({ length: 6 }).map((_, index) => (
							<InputOTPSlot
								key={index}
								index={index}
								className="size-12 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-800 first:rounded-md first:border last:rounded-md"
							/>
						))}
					</InputOTPGroup>
				</InputOTP>

				<Button type="button" className="mt-12 w-max text-sm" onClick={onContinue}>
					Continue
				</Button>
				<p className="mt-6 text-sm font-medium text-gray-600">
					Didn&apos;t receive the code? <span className="font-medium text-gray-800">Resend code</span>
				</p>
			</section>
		</div>
	);
}

function EnterNewPasswordStep() {
	const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

	return (
		<div className="flex h-full flex-col p-6">
			<section aria-labelledby="new-password-heading" className="flex flex-col gap-4">
				<div className="flex flex-col gap-3">
					<Label
						htmlFor="new-password"
						id="new-password-heading"
						className="text-sm font-medium text-gray-600"
					>
						New password <span className="font-normal text-gray-400">(required)</span>
					</Label>
					<div className="relative">
						<Input
							id="new-password"
							name="newPassword"
							type={isNewPasswordVisible ? "text" : "password"}
							placeholder="Enter new password"
							autoComplete="new-password"
							required
						/>
						<button
							type="button"
							className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100"
							aria-label={isNewPasswordVisible ? "Hide new password" : "Show new password"}
							onClick={() => setIsNewPasswordVisible((prev) => !prev)}
						>
							{isNewPasswordVisible ? (
								<RiEyeOffLine className="size-4" aria-hidden="true" />
							) : (
								<RiEyeLine className="size-4" aria-hidden="true" />
							)}
						</button>
					</div>
					<ul className="flex list-none flex-col gap-3 text-sm text-gray-400">
						<li>At least 8 characters</li>
						<li>At least one uppercase letter</li>
						<li>At least one number</li>
					</ul>
				</div>
				<div className="flex flex-col gap-3">
					<Label htmlFor="confirm-new-password" className="text-sm font-medium text-gray-600">
						Confirm new password <span className="font-normal text-gray-400">(required)</span>
					</Label>
					<div className="relative">
						<Input
							id="confirm-new-password"
							name="confirmNewPassword"
							type={isConfirmPasswordVisible ? "text" : "password"}
							placeholder="Enter new password"
							autoComplete="new-password"
							required
						/>
						<button
							type="button"
							className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100"
							aria-label={
								isConfirmPasswordVisible
									? "Hide confirmation password"
									: "Show confirmation password"
							}
							onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
						>
							{isConfirmPasswordVisible ? (
								<RiEyeOffLine className="size-4" aria-hidden="true" />
							) : (
								<RiEyeLine className="size-4" aria-hidden="true" />
							)}
						</button>
					</div>
				</div>
			</section>
			<Button type="button" className="mt-12 self-end text-sm">
				Change password
			</Button>
		</div>
	);
}

function ActiveSession() {
	return (
		<div className="flex flex-col gap-6 px-6 py-4">
			<section aria-labelledby="active-sessions-heading" className="flex flex-col gap-4">
				<div className="flex w-full items-start rounded-2xl border border-gray-200 p-4">
					<div className="flex min-w-0 flex-1 items-start gap-4">
						<RiMacbookLine className="text-gray-600" aria-hidden="true" />
						<div className="flex flex-col gap-1.5 text-sm">
							<h4 className="font-medium text-gray-600">Chrome on Windows</h4>
							<div className="flex items-center gap-2 text-sm text-gray-400">
								<p className="font-medium">Lagos, Nigeria</p>
								<span className="inline-block size-1 shrink-0 rounded-full bg-gray-400" aria-hidden="true" />
								<p className="font-medium">Active now</p>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2 text-sm text-green-800">
						<span className="inline-block size-1 shrink-0 rounded-full bg-green-800" aria-hidden="true" />
						<p className="font-medium">Current session</p>
					</div>
				</div>
				<div className="flex w-full items-start rounded-2xl border border-gray-200 p-4">
					<div className="flex min-w-0 flex-1 items-start gap-4">
						<RiMacbookLine className="text-gray-600" aria-hidden="true" />
						<div className="flex flex-col gap-1.5 text-sm">
							<h4 className="font-medium text-gray-600">Chrome on Macbook</h4>
							<div className="flex items-center gap-2 text-sm text-gray-400">
								<p className="font-medium">Lagos, Nigeria</p>
								<span className="inline-block size-1 shrink-0 rounded-full bg-gray-400" aria-hidden="true" />
								<p className="font-medium">Last seen 1 week ago</p>
							</div>
						</div>
					</div>
					<Button className="text-sm" variant="outline" aria-label="Log out of Chrome on Macbook">
						Log out
					</Button>
				</div>
				<div className="flex w-full items-start rounded-2xl border border-gray-200 p-4">
					<div className="flex min-w-0 flex-1 items-start gap-4">
						<RiMacbookLine className="text-gray-600" aria-hidden="true" />
						<div className="flex flex-col gap-1.5 text-sm">
							<h4 className="font-medium text-gray-600">Chrome on Windows</h4>
							<div className="flex items-center gap-2 text-sm text-gray-400">
								<p className="font-medium">Lagos, Nigeria</p>
								<span className="inline-block size-1 shrink-0 rounded-full bg-gray-400" aria-hidden="true" />
								<p className="font-medium">Active now</p>
							</div>
						</div>
					</div>
					<Button className="text-sm" variant="outline" aria-label="Log out of Chrome on Windows">
						Log out
					</Button>
				</div>
			</section>
		</div>
	);
}
