"use client";

import { useState, type ComponentType } from "react";
import {
	RiBankCardLine,
	RiBankCardFill,
	RiBuildingFill,
	RiBuildingLine,
	RiCloseLine,
	RiMoonFill,
	RiMoonLine,
	RiSettingsLine,
	RiTeamFill,
	RiTeamLine,
	RiUserFill,
	RiUserLine,
	RiUpload2Line,
	RiDeleteBin2Line,
	RiEdit2Line,
	RiArrowLeftLine,
} from "@remixicon/react";

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { authClient } from "@/lib/better-auth/auth.client";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { getInitials } from "@/lib/utils/get-initials";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

type SettingsSectionId = "profile" | "account" | "appearance" | "billing" | "members";

type SettingsSection = {
	id: SettingsSectionId;
	label: string;
	icon: ComponentType<{ className?: string }>;
	activeIcon: ComponentType<{ className?: string }>;
};

type SettingsSubView = "organization" | "active-session" | "change-password";

const settingsSubViewLabels: Record<SettingsSubView, string> = {
	organization: "Organization",
	"active-session": "Active sessions",
	"change-password": "Change password",
};

const settingsSections: SettingsSection[] = [
	{ id: "profile", label: "Profile", icon: RiUserLine, activeIcon: RiUserFill },
	{ id: "account", label: "Account", icon: RiBuildingLine, activeIcon: RiBuildingFill },
	{ id: "appearance", label: "Appearance", icon: RiMoonLine, activeIcon: RiMoonFill },
	{ id: "billing", label: "Billing", icon: RiBankCardLine, activeIcon: RiBankCardFill },
	{ id: "members", label: "Manage members", icon: RiTeamLine, activeIcon: RiTeamFill },
];

type SettingsDialogProps = {
	user: {
		name: string;
		email: string;
		image?: string | null;
	};
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function SettingsDialog({ user, open, onOpenChange }: SettingsDialogProps) {
	const [selectedSettingsSection, setSelectedSettingsSection] =
		useState<SettingsSectionId>("profile");
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canManageOrganization =
		activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const visibleSettingsSections = settingsSections.filter(
		({ id }) => canManageOrganization || (id !== "billing" && id !== "members"),
	);

	const [activeSettingsSubView, setActiveSettingsSubView] = useState<SettingsSubView | null>(null);
	const selectedSettingsSectionLabel = visibleSettingsSections.find(
		({ id }) => id === selectedSettingsSection,
	)?.label;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="h-[43.75rem] max-h-[calc(100vh-2rem)] max-w-[50rem] overflow-hidden p-0">
				<div className="flex h-full min-h-0">
					<aside className="w-[12.5rem] shrink-0 border-r bg-gray-50/70 p-2">
						<div className="flex h-10 items-center px-2">
							<DialogTitle className="text-base">Settings</DialogTitle>
							<DialogDescription className="sr-only">
								Manage your MediBridge profile and organization settings.
							</DialogDescription>
						</div>
						<nav aria-label="Settings sections" className="mt-3 flex flex-col gap-px">
							{visibleSettingsSections.map(({ id, label, icon: Icon, activeIcon: ActiveIcon }) => (
								<button
									key={id}
									type="button"
									className={cn(
										"flex h-8 w-full items-center gap-2 rounded-lg border border-transparent px-2.5 text-left text-sm transition-[background-color,box-shadow] focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100",
										selectedSettingsSection === id
											? "bg-gray-200 font-medium text-gray-800"
											: "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
									)}
									onClick={() => {
										setSelectedSettingsSection(id);
										setActiveSettingsSubView(null);
									}}
								>
									{selectedSettingsSection === id ? (
										<ActiveIcon className="size-4 shrink-0" />
									) : (
										<Icon className="size-4 shrink-0" />
									)}
									<span>{label}</span>
								</button>
							))}
						</nav>
					</aside>

					<section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
						<div className="flex items-center justify-between border-b px-6 py-4">
							{activeSettingsSubView ? (
								<button
									type="button"
									className="flex items-center gap-2 rounded-md font-semibold text-gray-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100"
									aria-label="Back to account settings"
									onClick={() => setActiveSettingsSubView(null)}
								>
									<RiArrowLeftLine className="size-5" aria-hidden="true" />
									<span>{settingsSubViewLabels[activeSettingsSubView]}</span>
								</button>
							) : (
								<h2 className="text-base font-semibold">{selectedSettingsSectionLabel}</h2>
							)}
							<DialogClose
								className="rounded-md p-1.5 text-foreground/60 transition-colors hover:bg-gray-100 hover:text-foreground"
								aria-label="Close settings"
							>
								<RiCloseLine className="size-5" />
							</DialogClose>
						</div>
						<div className="flex-1 overflow-y-auto">
							{selectedSettingsSection === "profile" ? <ProfileSettings user={user} /> : null}
							{selectedSettingsSection === "account" ? (
								<AccountSettings
									activeSettingsSubView={activeSettingsSubView}
									onSettingsSubViewChange={setActiveSettingsSubView}
								/>
							) : null}
							{selectedSettingsSection === "appearance" ? <AppearanceSettings /> : null}
							{selectedSettingsSection === "billing" ? <BillingSettings /> : null}
							{selectedSettingsSection === "members" ? <MembersSettings /> : null}
						</div>
					</section>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function ProfileSettings({ user }: { user: SettingsDialogProps["user"] }) {
	return (
		<div className="flex h-full flex-col items-center gap-16 pt-6">
			<PatientAvatarMenu patientName={user.name} />
			<dl className="w-full px-6">
				<div className="flex h-16 items-center justify-between gap-4 border-b">
					<dt className="text-sm text-gray-400 font-medium">
						<label htmlFor="settings-full-name">Full name</label>
					</dt>
					<dd>
						<input
							id="settings-full-name"
							name="fullName"
							type="text"
							defaultValue={user.name}
							className="text-right text-sm font-semibold focus:border-0 focus-visible:border-0 focus:outline-0"
						/>
					</dd>
				</div>
				<div className="flex h-16 items-center justify-between gap-4 border-b opacity-50">
					<dt className="text-sm text-gray-400 font-medium">Email</dt>
					<dd className="text-sm font-semibold text-gray-800">{user.email}</dd>
				</div>
			</dl>
			<div className="mt-auto flex w-full shrink-0 gap-2 border-t px-6 py-5">
				<Button variant="outline" className="text-sm ml-auto">
					Cancel
				</Button>
				<Button className="text-sm">Save</Button>
			</div>
		</div>
	);
}

function PatientAvatarMenu({ patientName }: { patientName: string }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="relative w-max">
					<Avatar className="size-[146px] border border-gray-200 bg-gray-100 text-gray-700">
						<AvatarFallback className="bg-gray-100 text-4xl font-semibold text-gray-700">
							{getInitials(patientName ?? "")}
						</AvatarFallback>
					</Avatar>
					<div className="absolute right-[3px] bottom-[3px] size-[28px] border border-white/20 text-white bg-gray-800 flex items-center justify-center rounded-full ring ring-gray-800">
						<RiEdit2Line className="size-[18px]" />
					</div>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="center"
				sideOffset={12}
				className="w-[13.75rem] rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
			>
				<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
					<RiUpload2Line className="text-white" />
					<span>Upload image</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
					<RiDeleteBin2Line className="text-white" />
					<span>Remove image</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function AccountSettings({
	activeSettingsSubView,
	onSettingsSubViewChange,
}: {
	activeSettingsSubView: SettingsSubView | null;
	onSettingsSubViewChange: (view: SettingsSubView | null) => void;
}) {
	if (activeSettingsSubView === "organization") {
		return (
			<div className="flex flex-col gap-6 px-6 pt-4">
				<section aria-labelledby="organization-details-heading">
					<h3 id="organization-details-heading" className="font-semibold">
						Organization details
					</h3>
					<dl>
						<div className="grid h-16 grid-cols-[1fr_auto] grid-rows-2 items-center border-b">
							<dt className="col-start-1 row-start-1 self-end text-sm font-medium text-gray-400">
								Organization name
							</dt>
							<dd className="col-start-1 row-start-2 self-start text-sm font-semibold text-gray-600">
								Medicare General Hospital
							</dd>
						</div>
					</dl>
				</section>
			</div>
		);
	}

	if (activeSettingsSubView === "change-password") {
		return (
			<div className="flex flex-col gap-6 px-6 pt-4">
				<section aria-labelledby="change-password-heading">
					<h3 id="change-password-heading" className="font-semibold">
						Change password
					</h3>
					<p className="mt-1 text-sm text-gray-400">
						Update the password used to sign in to your account.
					</p>
				</section>
			</div>
		);
	}

	if (activeSettingsSubView === "active-session") {
		return (
			<div className="flex flex-col gap-6 px-6 pt-4">
				<section aria-labelledby="active-sessions-heading">
					<h3 id="active-sessions-heading" className="font-semibold">
						Active sessions
					</h3>
					<p className="mt-1 text-sm text-gray-400">3 devices are currently signed in.</p>
				</section>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col gap-6 pt-4">
			<section aria-labelledby="organization-settings-heading" className="px-6">
				<h3 id="organization-settings-heading" className="font-semibold">
					Organization
				</h3>
				<dl>
					<div className="grid h-16 grid-cols-[1fr_auto] grid-rows-2 items-center border-b">
						<dt className="col-start-1 row-start-1 self-end text-sm font-medium text-gray-400">
							Organization name
						</dt>
						<dd className="col-start-1 row-start-2 self-start text-sm font-semibold text-gray-600">
							Medicare General Hospital
						</dd>
						<dd className="col-start-2 row-span-2 self-center">
							<Button
								type="button"
								className="text-sm font-medium text-gray-400"
								variant="ghost"
								onClick={() => onSettingsSubViewChange("organization")}
							>
								View
							</Button>
						</dd>
					</div>
				</dl>
			</section>
			<section aria-labelledby="account-security-heading" className="px-6">
				<h3 id="account-security-heading" className="font-semibold">
					Account security
				</h3>
				<dl>
					<div className="grid h-16 grid-cols-[1fr_auto] grid-rows-2 items-center">
						<dt className="col-start-1 row-start-1 self-end text-sm font-medium text-gray-400">
							Password
						</dt>
						<dd className="col-start-1 row-start-2 self-start text-sm font-semibold text-gray-600">
							************
						</dd>
						<dd className="col-start-2 row-span-2 self-center">
							<Button
								type="button"
								className="text-sm font-medium text-gray-400"
								variant="ghost"
								onClick={() => onSettingsSubViewChange("change-password")}
							>
								Change
							</Button>
						</dd>
					</div>
					<div className="grid h-16 grid-cols-[1fr_auto] grid-rows-2 items-center border-b">
						<dt className="col-start-1 row-start-1 self-end text-sm font-medium text-gray-400">
							Active session
						</dt>
						<dd className="col-start-1 row-start-2 self-start text-sm font-semibold text-gray-600">
							3 devices currently signed in
						</dd>
						<dd className="col-start-2 row-span-2 self-center">
							<Button
								type="button"
								className="text-sm font-medium text-gray-400"
								variant="ghost"
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
				className="flex items-center justify-between px-6"
			>
				<div className="flex flex-col gap-[6px]">
					<h3 id="danger-zone-heading" className="font-semibold text-destructive">
						Danger zone
					</h3>
					<p className="w-full max-w-[430px] text-gray-400">
						Deleting an account is permanent and may require transferring organization ownership
						first
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					className="border-destructive text-sm text-destructive"
				>
					Delete account
				</Button>
			</section>
		</div>
	);
}

function Organization() {
	return <div></div>;
}
function ChangePassword() {
	return <div></div>;
}
function ActiveSession() {
	return <div></div>;
}

function AppearanceSettings() {
	const [selectedTheme, setSelectedTheme] = useState("system");
	const [selectedContrast, setSelectedContrast] = useState("system");

	return (
		<div className="px-6">
			<dl>
				<div className="flex h-16 items-center justify-between gap-4 border-b">
					<dt id="theme-setting-label" className="text-sm text-gray-400">
						Theme
					</dt>
					<dd>
						<Select value={selectedTheme} onValueChange={setSelectedTheme}>
							<SelectTrigger
								aria-labelledby="theme-setting-label"
								className="h-9 border-transparent px-3 text-gray-800 font-semibold hover:bg-gray-100"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end" className="min-w-[220px]">
								<SelectItem value="system">System</SelectItem>
								<SelectItem value="dark">Dark</SelectItem>
								<SelectItem value="light">Light</SelectItem>
							</SelectContent>
						</Select>
					</dd>
				</div>
				<div className="flex h-16 items-center justify-between gap-4 border-b">
					<dt id="contrast-setting-label" className="text-sm text-gray-400">
						Contrast
					</dt>
					<dd>
						<Select value={selectedContrast} onValueChange={setSelectedContrast}>
							<SelectTrigger
								aria-labelledby="contrast-setting-label"
								className="h-9 border-transparent px-3 text-gray-800 font-semibold hover:bg-gray-100"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end" className="min-w-[220px]">
								<SelectItem value="system">System</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="increased">Increased</SelectItem>
							</SelectContent>
						</Select>
					</dd>
				</div>
			</dl>
		</div>
	);
}

function BillingSettings() {
	return (
		<div className="space-y-5">
			<div className="rounded-xl border p-4">
				<p className="text-sm text-foreground/60">Current plan</p>
				<p className="mt-1 font-medium">MediBridge hospital plan</p>
			</div>
			<SettingsRow label="Payment method" value="Manage payment method" />
			<SettingsRow label="Invoices" value="View billing history" />
		</div>
	);
}

function MembersSettings() {
	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between rounded-xl border p-4">
				<div>
					<p className="font-medium">Hospital team</p>
					<p className="text-sm text-foreground/60">Manage members and their roles.</p>
				</div>
				<button
					type="button"
					className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
				>
					Invite member
				</button>
			</div>
			<SettingsRow label="Members" value="View and manage team access" />
			<SettingsRow label="Roles" value="Owner, admin, and member permissions" />
		</div>
	);
}

function SettingsRow({
	label,
	value,
	showBorder = true,
}: {
	label: string;
	value: string;
	showBorder?: boolean;
}) {
	return (
		<div className={cn("flex items-center justify-between gap-4 h-16", showBorder && "border-b")}>
			<span className="text-sm text-foreground/70">{label}</span>
			<span className="text-right text-sm font-medium">{value}</span>
		</div>
	);
}
