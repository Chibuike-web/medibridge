"use client";

import { useState, type ComponentType } from "react";
import {
	RiArrowLeftLine,
	RiBankCardFill,
	RiBankCardLine,
	RiBuildingFill,
	RiBuildingLine,
	RiCloseLine,
	RiMoonFill,
	RiMoonLine,
	RiTeamFill,
	RiTeamLine,
	RiUserFill,
	RiUserLine,
} from "@remixicon/react";

import { AccountSettings } from "@/components/layout/settings/account-settings";
import { AppearanceSettings } from "@/components/layout/settings/appearance-settings";
import { BillingSettings } from "@/components/layout/settings/billing-settings";
import { MembersSettings } from "@/components/layout/settings/members-settings";
import { ProfileSettings } from "@/components/layout/settings/profile-settings";
import type {
	ChangePasswordView,
	PendingInvitation,
	SettingsDialogUser,
	SettingsSectionId,
	SettingsSubView,
} from "@/components/layout/settings/types";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/better-auth/auth.client";
import { cn } from "@/lib/utils/cn";

type SettingsSection = {
	id: SettingsSectionId;
	label: string;
	icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
	activeIcon: ComponentType<{
		className?: string;
		"aria-hidden"?: boolean | "true" | "false";
	}>;
};

const settingsSubViewLabels: Record<SettingsSubView, string> = {
	organization: "Organization",
	"active-session": "Active sessions",
	"change-password": "Change password",
	"payment-method": "Payment method",
	"billing-history": "Billing History",
	"invite-member": "Invite new member",
	"review-invitations": "Review invitations",
};

const settingsSections: SettingsSection[] = [
	{ id: "profile", label: "Profile", icon: RiUserLine, activeIcon: RiUserFill },
	{ id: "account", label: "Account", icon: RiBuildingLine, activeIcon: RiBuildingFill },
	{ id: "appearance", label: "Appearance", icon: RiMoonLine, activeIcon: RiMoonFill },
	{ id: "billing", label: "Billing", icon: RiBankCardLine, activeIcon: RiBankCardFill },
	{ id: "members", label: "Manage members", icon: RiTeamLine, activeIcon: RiTeamFill },
];

function isOrganizationSettingsSection(sectionId: SettingsSectionId) {
	return sectionId === "billing" || sectionId === "members";
}

const pendingInvitations: PendingInvitation[] = [
	{
		id: "invitation-grace-nwosu",
		name: "Grace Nwosu",
		email: "grace@example.com",
		role: "member",
		status: "pending",
		sentAt: "Aug 15, 2026",
		expiresAt: "Aug 24, 2026",
	},
];

type SettingsDialogProps = {
	user: SettingsDialogUser;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function SettingsDialog({ user, open, onOpenChange }: SettingsDialogProps) {
	const [selectedSettingsSection, setSelectedSettingsSection] =
		useState<SettingsSectionId>("profile");
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const { data: activeOrganization } = authClient.useActiveOrganization();
	const manageableOrganizationRole =
		activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin"
			? activeMemberRole.role
			: null;
	const canManageOrganization = manageableOrganizationRole !== null;
	const visibleSettingsSections = settingsSections.filter(
		({ id }) => canManageOrganization || !isOrganizationSettingsSection(id),
	);
	const [activeSettingsSubView, setActiveSettingsSubView] = useState<SettingsSubView | null>(null);
	const [changePasswordView, setChangePasswordView] =
		useState<ChangePasswordView>("change-password");

	const handleSettingsSubViewBack = () => {
		if (activeSettingsSubView === "review-invitations") {
			setActiveSettingsSubView("invite-member");
			return;
		}

		if (activeSettingsSubView !== "change-password") {
			setActiveSettingsSubView(null);
			return;
		}

		if (changePasswordView === "enter-new-password") {
			setChangePasswordView("verify-your-identity");
			return;
		}

		if (changePasswordView === "verify-your-identity") {
			setChangePasswordView("change-password");
			return;
		}

		setActiveSettingsSubView(null);
	};
	const selectedSettingsSectionLabel = visibleSettingsSections.find(
		({ id }) => id === selectedSettingsSection,
	)?.label;

	function getSettingsBackButtonLabel() {
		if (activeSettingsSubView === "change-password") {
			if (changePasswordView !== "change-password") {
				return "Back to previous password step";
			}
			return "Back to account settings";
		}
		if (activeSettingsSubView === "active-session") {
			return "Back to account settings";
		}

		if (activeSettingsSubView === "billing-history" || activeSettingsSubView === "payment-method") {
			return "Back to billing settings";
		}

		if (activeSettingsSubView === "invite-member") {
			return "Back to manage members";
		}
		if (activeSettingsSubView === "organization") {
			return "Back to account settings";
		}

		if (activeSettingsSubView === "review-invitations") {
			return "Back to invite new member";
		}

		return "Back to settings";
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="h-[43.75rem] max-h-[calc(100vh-2rem)] max-w-[50rem] overflow-hidden p-0">
				<div className="flex h-full min-h-0">
					<aside className="w-[12.5rem] shrink-0 border-r bg-white p-2">
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
										<ActiveIcon className="size-4 shrink-0" aria-hidden={true} />
									) : (
										<Icon className="size-4 shrink-0" aria-hidden={true} />
									)}
									<span>{label}</span>
								</button>
							))}
						</nav>
					</aside>

					<section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
						<div className="flex items-center justify-between border-b px-6 py-4">
							{activeSettingsSubView ? (
								<div className="flex items-center gap-2">
									<button
										type="button"
										className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-transparent text-gray-800 transition-colors hover:bg-gray-100 focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100"
										aria-label={getSettingsBackButtonLabel()}
										onClick={handleSettingsSubViewBack}
									>
										<RiArrowLeftLine className="size-5" aria-hidden="true" />
									</button>
									<h2 className="text-base font-semibold">
										{settingsSubViewLabels[activeSettingsSubView]}
									</h2>
								</div>
							) : (
								<h2 className="text-base font-semibold">{selectedSettingsSectionLabel}</h2>
							)}
							<DialogClose
								className="rounded-md border border-transparent p-1.5 text-foreground/60 transition-colors hover:bg-gray-100 hover:text-foreground focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100"
								aria-label="Close settings"
							>
								<RiCloseLine className="size-5" aria-hidden="true" />
							</DialogClose>
						</div>
						<div className="flex-1 overflow-y-auto">
							{selectedSettingsSection === "profile" ? <ProfileSettings user={user} /> : null}
							{selectedSettingsSection === "account" ? (
								<AccountSettings
									viewerRole={
										activeMemberRole?.role === "owner" ||
										activeMemberRole?.role === "admin" ||
										activeMemberRole?.role === "member"
											? activeMemberRole.role
											: null
									}
									organizationName={activeOrganization?.name ?? null}
									activeSettingsSubView={activeSettingsSubView}
									changePasswordView={changePasswordView}
									onChangePasswordView={setChangePasswordView}
									onSettingsSubViewChange={setActiveSettingsSubView}
								/>
							) : null}
							{selectedSettingsSection === "appearance" ? <AppearanceSettings /> : null}
							{selectedSettingsSection === "billing" ? (
								<BillingSettings
									activeSettingsSubView={activeSettingsSubView}
									onSettingsSubViewChange={setActiveSettingsSubView}
								/>
							) : null}
							{selectedSettingsSection === "members" && manageableOrganizationRole ? (
								<MembersSettings
									activeSettingsSubView={activeSettingsSubView}
									currentUser={user}
									onSettingsSubViewChange={setActiveSettingsSubView}
									pendingInvitations={pendingInvitations}
									viewerRole={manageableOrganizationRole}
								/>
							) : null}
						</div>
					</section>
				</div>
			</DialogContent>
		</Dialog>
	);
}
