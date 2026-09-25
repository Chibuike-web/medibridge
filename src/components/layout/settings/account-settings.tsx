"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { RiEyeLine, RiEyeOffLine, RiMacbookLine } from "@remixicon/react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/better-auth/auth.client";

import type { SettingsSubView } from "./types";
import { SuccessModal } from "@/components/success-modal";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { DeleteAccountDialog } from "./delete-account-dialog";
import type { OrganizationRole } from "./types";

export function AccountSettings({
	activeSettingsSubView,
	onSettingsSubViewChange,
	viewerRole,
	organizationName,
}: {
	viewerRole: OrganizationRole | null;
	organizationName: string | null;
	activeSettingsSubView: SettingsSubView | null;
	onSettingsSubViewChange: (view: SettingsSubView | null) => void;
}) {
	const [isPasswordChangeSuccessOpen, setIsPasswordChangeSuccessOpen] = useState(false);
	const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

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
								<StatusBadge className="no-line-height" status="Verified" />
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
		return (
			<ChangePasswordForm
				onSuccess={() => {
					onSettingsSubViewChange(null);
					setIsPasswordChangeSuccessOpen(true);
				}}
			/>
		);
	}

	if (activeSettingsSubView === "active-session") {
		return <ActiveSession />;
	}

	return (
		<>
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
									className="font-medium text-gray-400"
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
									className="font-medium text-gray-400"
									variant="ghost"
									aria-label="Change password"
									onClick={() => onSettingsSubViewChange("change-password")}
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
									className="font-medium text-gray-400"
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
				<section
					aria-labelledby="danger-zone-heading"
					className="flex items-center justify-between"
				>
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
						variant="destructive"
						disabled={!viewerRole || !organizationName}
						onClick={() => setIsDeleteAccountOpen(true)}
						className="border border-destructive bg-transparent text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:bg-transparent dark:hover:bg-destructive/10 dark:focus-visible:ring-destructive/40"
					>
						Delete account
					</Button>
				</section>
			</div>
			{viewerRole && organizationName && (
				<DeleteAccountDialog
					open={isDeleteAccountOpen}
					onOpenChange={setIsDeleteAccountOpen}
					viewerRole={viewerRole}
					organizationName={organizationName}
				/>
			)}
			<SuccessModal
				heading="Password changed"
				description="Your password has been successfully updated.
For your security, all other active sessions have been signed out."
				isOpen={isPasswordChangeSuccessOpen}
				setIsOpen={setIsPasswordChangeSuccessOpen}
			>
				<DialogFooter>
					<DialogClose asChild>
						<Button className="flex-1">Done</Button>
					</DialogClose>
				</DialogFooter>
			</SuccessModal>
		</>
	);
}

function ChangePasswordForm({ onSuccess }: { onSuccess: () => void }) {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmedPassword, setConfirmedPassword] = useState("");
	const [changePasswordError, setChangePasswordError] = useState("");
	const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
	const [isPending, startTransition] = useTransition();
	const isCurrentPasswordError = changePasswordError === "Current password is incorrect.";
	const isPasswordMismatch = changePasswordError === "Passwords do not match.";

	return (
		<form
			className="flex h-full flex-col gap-10 p-6"
			aria-busy={isPending}
			onSubmit={(event) => {
				event.preventDefault();
				if (newPassword !== confirmedPassword) {
					setChangePasswordError("Passwords do not match.");
					return;
				}

				setChangePasswordError("");
				startTransition(async () => {
					try {
						const { error } = await authClient.changePassword({
							currentPassword,
							newPassword,
							revokeOtherSessions: true,
						});

						if (error) {
							setChangePasswordError(
								error.code === "INVALID_PASSWORD"
									? "Current password is incorrect."
									: "We couldn’t change your password. Please try again.",
							);
							return;
						}

						onSuccess();
					} catch {
						setChangePasswordError("We couldn’t change your password. Please try again.");
					}
				});
			}}
		>
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
					disabled={isPending}
					value={currentPassword}
					aria-invalid={isCurrentPasswordError}
					aria-describedby={isCurrentPasswordError ? "current-password-error" : undefined}
					onChange={(event) => {
						setCurrentPassword(event.target.value);
						setChangePasswordError("");
					}}
				/>
				{isCurrentPasswordError && (
					<p id="current-password-error" role="alert" className="text-sm text-red-600">
						{changePasswordError}
					</p>
				)}
			</section>
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
							minLength={8}
							maxLength={128}
							required
							disabled={isPending}
							value={newPassword}
							aria-describedby="new-password-requirement"
							onChange={(event) => {
								setNewPassword(event.target.value);
								setChangePasswordError("");
							}}
						/>
						<button
							type="button"
							className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100"
							aria-label={isNewPasswordVisible ? "Hide new password" : "Show new password"}
							aria-pressed={isNewPasswordVisible}
							onClick={() => setIsNewPasswordVisible((prev) => !prev)}
						>
							{isNewPasswordVisible ? (
								<RiEyeOffLine className="size-4" aria-hidden="true" />
							) : (
								<RiEyeLine className="size-4" aria-hidden="true" />
							)}
						</button>
					</div>
					<p id="new-password-requirement" className="text-sm text-gray-400">
						Use 8 to 128 characters.
					</p>
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
							disabled={isPending}
							value={confirmedPassword}
							aria-invalid={isPasswordMismatch}
							aria-describedby={isPasswordMismatch ? "confirm-password-error" : undefined}
							onChange={(event) => {
								setConfirmedPassword(event.target.value);
								setChangePasswordError("");
							}}
						/>
						<button
							type="button"
							className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100"
							aria-label={
								isConfirmPasswordVisible
									? "Hide confirmation password"
									: "Show confirmation password"
							}
							aria-pressed={isConfirmPasswordVisible}
							onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
						>
							{isConfirmPasswordVisible ? (
								<RiEyeOffLine className="size-4" aria-hidden="true" />
							) : (
								<RiEyeLine className="size-4" aria-hidden="true" />
							)}
						</button>
					</div>
					{isPasswordMismatch && (
						<p id="confirm-password-error" role="alert" className="text-sm text-red-600">
							{changePasswordError}
						</p>
					)}
				</div>
			</section>
			{changePasswordError && !isCurrentPasswordError && !isPasswordMismatch && (
				<p role="alert" className="text-sm text-red-600">
					{changePasswordError}
				</p>
			)}
			<Button type="submit" className="mt-2 self-end" disabled={isPending}>
				{isPending ? "Changing password..." : "Change password"}
			</Button>
		</form>
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
								<span
									className="inline-block size-1 shrink-0 rounded-full bg-gray-400"
									aria-hidden="true"
								/>
								<p className="font-medium">Active now</p>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2 text-sm text-green-800">
						<span
							className="inline-block size-1 shrink-0 rounded-full bg-green-800"
							aria-hidden="true"
						/>
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
								<span
									className="inline-block size-1 shrink-0 rounded-full bg-gray-400"
									aria-hidden="true"
								/>
								<p className="font-medium">Last seen 1 week ago</p>
							</div>
						</div>
					</div>
					<Button variant="outline" aria-label="Log out of Chrome on Macbook">
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
								<span
									className="inline-block size-1 shrink-0 rounded-full bg-gray-400"
									aria-hidden="true"
								/>
								<p className="font-medium">Active now</p>
							</div>
						</div>
					</div>
					<Button variant="outline" aria-label="Log out of Chrome on Windows">
						Log out
					</Button>
				</div>
			</section>
		</div>
	);
}
