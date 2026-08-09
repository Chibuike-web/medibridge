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

type SettingsSectionId = "profile" | "account" | "appearance" | "billing" | "members";

type SettingsSection = {
	id: SettingsSectionId;
	label: string;
	icon: ComponentType<{ className?: string }>;
	activeIcon: ComponentType<{ className?: string }>;
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
									onClick={() => setSelectedSettingsSection(id)}
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

					<section className="min-w-0 flex-1 overflow-y-auto">
						<div className="flex items-center justify-between border-b px-6 py-4">
							<h2 className="text-base font-semibold">
								{visibleSettingsSections.find(({ id }) => id === selectedSettingsSection)?.label}
							</h2>
							<DialogClose
								className="rounded-md p-1.5 text-foreground/60 transition-colors hover:bg-gray-100 hover:text-foreground"
								aria-label="Close settings"
							>
								<RiCloseLine className="size-5" />
							</DialogClose>
						</div>
						<div className="space-y-6 p-6">
							{selectedSettingsSection === "profile" ? <ProfileSettings user={user} /> : null}
							{selectedSettingsSection === "account" ? <AccountSettings /> : null}
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
		<div className="space-y-5">
			<SettingsRow label="Full name" value={user.name} />
			<SettingsRow label="Email address" value={user.email} />
		</div>
	);
}

function AccountSettings() {
	return (
		<div className="space-y-5">
			<SettingsRow label="Hospital information" value="Organization details" />
			<SettingsRow label="Verification status" value="Verified organization" />
			<SettingsRow
				label="Account security"
				value="Password and active sessions"
				showBorder={false}
			/>
			<div className="border-t pt-5">
				<p className="text-sm font-medium text-red-600">Danger zone</p>
				<p className="mt-1 text-sm text-foreground/60">
					Deleting an account is permanent and may require transferring organization ownership
					first.
				</p>
				<button
					type="button"
					className="mt-4 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
				>
					Delete account
				</button>
			</div>
		</div>
	);
}

function AppearanceSettings() {
	return (
		<div className="space-y-5">
			<SettingsRow label="Theme" value="System" />
			<SettingsRow label="Contrast" value="Default" />
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
		<div className={cn("flex items-center justify-between gap-4 py-4", showBorder && "border-b")}>
			<span className="text-sm text-foreground/70">{label}</span>
			<span className="text-right text-sm font-medium">{value}</span>
		</div>
	);
}
