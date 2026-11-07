"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
	RiArrowLeftLine,
	RiArrowLeftSLine,
	RiArrowRightSLine,
	RiDeleteBin2Line,
	RiEyeLine,
	RiEyeOffLine,
	RiLogoutBoxLine,
	RiMore2Fill,
	RiSearchLine,
	RiUpload2Line,
} from "@remixicon/react";

import { StatusBadge } from "@/components/status-badge";
import { SuccessModal } from "@/components/success-modal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PixelLoader } from "@/components/ui/pixel-loader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/better-auth/auth.client";
import { cn } from "@/lib/utils/cn";
import { getInitials } from "@/lib/utils/get-initials";

import { DeleteAccountDialog } from "./delete-account-dialog";
import type { OrganizationRole, SettingsDialogUser } from "./types";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

const activeSessions = [
	{
		id: "session-windows-current",
		device: "Chrome (Windows)",
		location: "Lagos, Nigeria",
		signedInAt: "21st Apr 2026, 9:40AM",
		lastActiveAt: "Now",
	},
	{
		id: "session-macbook",
		device: "Chrome (Mac OS X)",
		location: "Lagos, Nigeria",
		signedInAt: "14th Apr 2026, 8:15AM",
		lastActiveAt: "21st Apr 2026, 7:02AM",
	},
	{
		id: "session-windows",
		device: "Chrome (Windows)",
		location: "Enugu, Nigeria",
		signedInAt: "2nd Apr 2026, 4:30PM",
		lastActiveAt: "18th Apr 2026, 6:45PM",
	},
];

export function AccountSettings({
	user,
	isChangePasswordOpen,
	onChangePasswordOpenChange,
	viewerRole,
	organizationName,
	organizationId,
}: {
	user: SettingsDialogUser;
	viewerRole: OrganizationRole | null;
	organizationName: string | null;
	organizationId: string | null;
	isChangePasswordOpen: boolean;
	onChangePasswordOpenChange: (open: boolean) => void;
}) {
	const [isPasswordChangeSuccessOpen, setIsPasswordChangeSuccessOpen] = useState(false);
	const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
	const [sessionQuery, setSessionQuery] = useState("");
	const [sessionPage, setSessionPage] = useState(1);
	const [sessionLimit, setSessionLimit] = useState(ROWS_PER_PAGE_OPTIONS[0]);
	const matchingSessions = activeSessions.filter((session) =>
		session.device.toLowerCase().includes(sessionQuery.trim().toLowerCase()),
	);
	const sessionPageCount = Math.max(1, Math.ceil(matchingSessions.length / sessionLimit));
	const visibleSessions = matchingSessions.slice(
		(sessionPage - 1) * sessionLimit,
		sessionPage * sessionLimit,
	);
	const fitsOnSmallestPage = matchingSessions.length <= ROWS_PER_PAGE_OPTIONS[0];

	if (isChangePasswordOpen) {
		return (
			<ChangePasswordForm
				onBack={() => onChangePasswordOpenChange(false)}
				onSuccess={() => {
					onChangePasswordOpenChange(false);
					setIsPasswordChangeSuccessOpen(true);
				}}
			/>
		);
	}

	return (
		<>
			<div className="flex flex-col gap-10 px-4 py-5">
				<section aria-labelledby="profile-settings-heading">
					<h3 id="profile-settings-heading" className="font-semibold">
						Profile
					</h3>
					<dl>
						<div className="flex h-16 items-center justify-between gap-4 border-b">
							<dt className="flex flex-col gap-1">
								<span className="text-sm font-medium text-gray-600">Profile photo</span>
								<span className="text-sm text-gray-400">PNG, JPEG, or WebP, up to 10MB.</span>
							</dt>
							<dd>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											type="button"
											className="h-auto rounded-full border-0 p-0 hover:bg-transparent focus-visible:border-0"
											aria-label="Change profile photo"
										>
											<Avatar className="size-12 border border-gray-200 bg-gray-100 text-gray-700">
												<AvatarFallback className="bg-gray-100 text-sm font-semibold text-gray-700">
													{getInitials(user.name)}
												</AvatarFallback>
											</Avatar>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="end"
										className="rounded-xl bg-white text-sm text-gray-700"
									>
										<DropdownMenuItem className="rounded-lg">
											<RiUpload2Line aria-hidden="true" />
											<span>Upload image</span>
										</DropdownMenuItem>
										<DropdownMenuItem className="rounded-lg text-rose-600 focus:bg-rose-50 focus:text-rose-600">
											<RiDeleteBin2Line className="text-current" aria-hidden="true" />
											<span>Remove image</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</dd>
						</div>
						<div className="flex h-16 items-center justify-between gap-4 border-b">
							<dt className="text-sm font-medium text-gray-600">Full name</dt>
							<dd className="truncate text-sm font-semibold text-gray-800">{user.name}</dd>
						</div>
						<div className="flex h-16 items-center justify-between gap-4 border-b">
							<dt className="text-sm font-medium text-gray-600">Email</dt>
							<dd className="truncate text-sm font-semibold text-gray-800">{user.email}</dd>
						</div>
					</dl>
				</section>

				<section aria-labelledby="active-sessions-heading" className="flex flex-col gap-4">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<h3 id="active-sessions-heading" className="font-semibold">
							Active sessions
						</h3>
						<div className="flex flex-wrap items-center gap-2 max-md:w-full">
							<div className="relative w-72 max-md:w-full">
								<RiSearchLine className="pointer-events-none absolute bottom-0 left-2 flex h-full size-4 items-center justify-center text-gray-400" />
								<Input
									type="search"
									className="pl-8"
									aria-label="Search devices"
									placeholder="Search devices"
									value={sessionQuery}
									onChange={(event) => {
										setSessionQuery(event.target.value);
										setSessionPage(1);
									}}
								/>
							</div>
							<Button
								type="button"
								variant="destructive"
								className="border border-destructive bg-transparent text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive dark:bg-transparent dark:hover:bg-destructive/10 max-md:w-full"
							>
								Log out all devices
							</Button>
						</div>
					</div>
					<div className="overflow-x-auto rounded-xl border border-gray-200">
						<Table className="min-w-[40rem] border-separate border-spacing-0 bg-gray-50 text-left">
							<TableHeader className="text-sm font-semibold text-gray-500">
								<TableRow>
									<TableHead className="h-10 bg-gray-50 px-3 py-0 whitespace-nowrap text-gray-600">
										Device
									</TableHead>
									<TableHead className="h-10 bg-gray-50 px-3 py-0 whitespace-nowrap text-gray-600">
										Location
									</TableHead>
									<TableHead className="h-10 bg-gray-50 px-3 py-0 whitespace-nowrap text-gray-600">
										Signed in
									</TableHead>
									<TableHead className="h-10 bg-gray-50 px-3 py-0 whitespace-nowrap text-gray-600">
										Last active
									</TableHead>
									<TableHead className="h-10 w-14 bg-gray-50 px-3 py-0">
										<span className="sr-only">Actions</span>
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody className="overflow-hidden rounded-t-xl outline outline-gray-200">
								{visibleSessions.length ? (
									visibleSessions.map((session, rowPosition) => (
										<TableRow key={session.id} className="h-14">
											<TableCell
												className={cn(
													"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm text-gray-600",
													rowPosition === visibleSessions.length - 1 && "border-b-0",
													rowPosition === 0 && "rounded-tl-lg",
												)}
											>
												{session.device}
											</TableCell>
											<TableCell
												className={cn(
													"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm text-gray-600",
													rowPosition === visibleSessions.length - 1 && "border-b-0",
												)}
											>
												{session.location}
											</TableCell>
											<TableCell
												className={cn(
													"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm text-gray-600",
													rowPosition === visibleSessions.length - 1 && "border-b-0",
												)}
											>
												{session.signedInAt}
											</TableCell>
											<TableCell
												className={cn(
													"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm text-gray-600",
													rowPosition === visibleSessions.length - 1 && "border-b-0",
												)}
											>
												{session.lastActiveAt}
											</TableCell>
											<TableCell
												className={cn(
													"h-14 border-b border-gray-200 bg-white px-3 py-0 text-right",
													rowPosition === visibleSessions.length - 1 && "border-b-0",
													rowPosition === 0 && "rounded-tr-lg",
												)}
											>
												<DropdownMenu>
													<DropdownMenuTrigger
														type="button"
														className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-200 hover:text-gray-800 data-[state=open]:bg-gray-200 data-[state=open]:text-gray-800"
														aria-label={`Open actions for ${session.device} in ${session.location}`}
													>
														<RiMore2Fill className="size-5" aria-hidden />
													</DropdownMenuTrigger>
													<DropdownMenuContent
														align="end"
														className="rounded-xl bg-white text-sm text-gray-700"
													>
														<DropdownMenuItem className="rounded-lg text-rose-600 focus:bg-rose-50 focus:text-rose-600">
															<RiLogoutBoxLine className="text-current" aria-hidden="true" />
															<span>Log out</span>
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={5}
											className="h-32 rounded-t-lg bg-white px-3 py-0 text-center text-sm text-gray-500"
										>
											No matching devices found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
						{fitsOnSmallestPage ? null : (
							<div className="flex items-center justify-between gap-3 overflow-x-auto border-t border-gray-200 bg-white p-3 text-sm whitespace-nowrap text-gray-500">
								<div className="flex items-center gap-3">
									<span>Rows per page</span>
									<Select
										value={String(sessionLimit)}
										onValueChange={(value) => {
											setSessionLimit(Number(value));
											setSessionPage(1);
										}}
									>
										<SelectTrigger className="h-8 w-16 bg-white px-2 text-gray-700">
											<SelectValue aria-label="Rows per page" placeholder="Rows" />
										</SelectTrigger>
										<SelectContent className="w-20" align="start">
											{ROWS_PER_PAGE_OPTIONS.map((pageSize) => (
												<SelectItem key={pageSize} value={String(pageSize)}>
													{pageSize}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="flex items-center gap-3">
									<span>
										Page {sessionPage} of {sessionPageCount}
									</span>
									<div className="flex items-center gap-2">
										<Button
											type="button"
											variant="outline"
											size="icon"
											aria-label="Previous"
											onClick={() => setSessionPage((prev) => prev - 1)}
											disabled={sessionPage <= 1}
											className="text-gray-700 shadow-none"
										>
											<RiArrowLeftSLine aria-hidden="true" />
										</Button>
										<Button
											type="button"
											variant="outline"
											size="icon"
											aria-label="Next"
											onClick={() => setSessionPage((prev) => prev + 1)}
											disabled={sessionPage >= sessionPageCount}
											className="text-gray-700 shadow-none"
										>
											<RiArrowRightSLine aria-hidden="true" />
										</Button>
									</div>
								</div>
							</div>
						)}
					</div>
				</section>

				<section aria-labelledby="organization-settings-heading">
					<h3 id="organization-settings-heading" className="font-semibold">
						Organization
					</h3>
					<dl>
						<div className="flex h-16 items-center justify-between gap-4 border-b">
							<dt className="text-sm font-medium text-gray-600">Organization name</dt>
							<dd className="truncate text-sm font-semibold text-gray-800">
								{organizationName ?? "-"}
							</dd>
						</div>
						<div className="flex h-16 items-center justify-between gap-4 border-b">
							<dt className="text-sm font-medium text-gray-600">Verification status</dt>
							<dd>
								<StatusBadge className="no-line-height" status="Verified" />
							</dd>
						</div>
						<div className="flex h-16 items-center justify-between gap-4 border-b">
							<dt className="shrink-0 text-sm font-medium text-gray-600">Organization ID</dt>
							<dd className="min-w-0 truncate text-sm font-semibold text-gray-800">
								{organizationId ?? "-"}
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
									className="text-gray-400"
									variant="ghost"
									aria-label="Change password"
									onClick={() => onChangePasswordOpenChange(true)}
								>
									Change
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
						className="border border-destructive bg-transparent text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive dark:bg-transparent dark:hover:bg-destructive/10"
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

function ChangePasswordForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
	const [passwordStep, setPasswordStep] = useState<"current" | "new">("current");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmedPassword, setConfirmedPassword] = useState("");
	const [changePasswordError, setChangePasswordError] = useState("");
	const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
	const [isPending, startTransition] = useTransition();
	const isCurrentPasswordError = changePasswordError === "Current password is incorrect.";
	const isPasswordMismatch = changePasswordError === "Passwords do not match.";

	if (passwordStep === "current") {
		return (
			<>
				<div className="px-4 pt-5">
					<Button
						variant="ghost"
						size="sm"
						type="button"
						className="text-gray-600 hover:bg-gray-100 hover:text-gray-800"
						aria-label="Back to account settings"
						onClick={onBack}
					>
						<RiArrowLeftLine aria-hidden="true" />
						Back
					</Button>
				</div>
				<form
					method="post"
					className="mx-auto flex w-full max-w-[31.25rem] flex-col gap-8 px-4 py-10"
					onSubmit={(event) => {
						event.preventDefault();
						setChangePasswordError("");
						setPasswordStep("new");
					}}
				>
					<h3 className="text-center text-base font-semibold text-gray-800 text-balance">
						Enter your current password
					</h3>
					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between gap-4">
							<Label htmlFor="current-password" className="text-sm font-medium text-gray-600">
								Current password <span className="font-normal text-gray-400">(required)</span>
							</Label>
							<Link
								href="/forgot-password"
								className="shrink-0 text-sm font-medium text-gray-600 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100"
							>
								Forgot password
							</Link>
						</div>
						<div className="flex flex-col gap-1.5">
							<Input
								id="current-password"
								name="currentPassword"
								type="password"
								placeholder="Enter current password"
								autoComplete="current-password"
								required
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
						</div>
					</div>
					<Button type="submit" className="w-full">
						Continue
					</Button>
				</form>
			</>
		);
	}

	return (
		<>
			<div className="px-4 pt-5">
				<Button
					variant="ghost"
					size="sm"
					type="button"
					className="text-gray-600 hover:bg-gray-100 hover:text-gray-800"
					aria-label="Back to current password"
					onClick={() => {
						setChangePasswordError("");
						setPasswordStep("current");
					}}
				>
					<RiArrowLeftLine aria-hidden="true" />
					Back
				</Button>
			</div>
			<form
				method="post"
				className="mx-auto flex w-full max-w-[31.25rem] flex-col gap-8 px-4 py-10"
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

							if (error?.code === "INVALID_PASSWORD") {
								setChangePasswordError("Current password is incorrect.");
								setPasswordStep("current");
								return;
							}

							if (error) {
								setChangePasswordError("We couldn’t change your password. Please try again.");
								return;
							}

							onSuccess();
						} catch (error) {
							console.error("Changing the password failed:", error);
							setChangePasswordError("We couldn’t change your password. Please try again.");
						}
					});
				}}
			>
				<h3 className="text-center text-base font-semibold text-gray-800 text-balance">
					Enter new password
				</h3>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-3">
						<Label htmlFor="new-password" className="text-sm font-medium text-gray-600">
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
							<Button
								variant="ghost"
								size="icon"
								type="button"
								className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-600 size-auto border-0 hover:bg-transparent hover:text-gray-600 focus-visible:border-0"
								aria-label={isNewPasswordVisible ? "Hide new password" : "Show new password"}
								aria-pressed={isNewPasswordVisible}
								onClick={() => setIsNewPasswordVisible((prev) => !prev)}
							>
								{isNewPasswordVisible ? (
									<RiEyeOffLine className="size-4" aria-hidden="true" />
								) : (
									<RiEyeLine className="size-4" aria-hidden="true" />
								)}
							</Button>
						</div>
						<p id="new-password-requirement" className="text-sm text-gray-400">
							Use 8 to 128 characters.
						</p>
					</div>
					<div className="flex flex-col gap-3">
						<Label htmlFor="confirm-new-password" className="text-sm font-medium text-gray-600">
							Confirm new password <span className="font-normal text-gray-400">(required)</span>
						</Label>
						<div className="flex flex-col gap-1.5">
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
								<Button
									variant="ghost"
									size="icon"
									type="button"
									className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-600 size-auto border-0 hover:bg-transparent hover:text-gray-600 focus-visible:border-0"
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
								</Button>
							</div>
							{isPasswordMismatch && (
								<p id="confirm-password-error" role="alert" className="text-sm text-red-600">
									{changePasswordError}
								</p>
							)}
						</div>
					</div>
				</div>
				{changePasswordError && !isPasswordMismatch && (
					<p role="alert" className="text-sm text-red-600">
						{changePasswordError}
					</p>
				)}
				<Button type="submit" className="grid w-full place-items-center" disabled={isPending}>
					<span
						className={isPending ? "invisible col-start-1 row-start-1" : "col-start-1 row-start-1"}
					>
						Change password
					</span>
					{isPending ? (
						<span className="col-start-1 row-start-1 flex">
							<PixelLoader label="Changing password..." />
						</span>
					) : null}
				</Button>
			</form>
		</>
	);
}
