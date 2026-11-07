"use client";

import { useState, type ComponentType } from "react";
import {
	RiArrowLeftLine,
	RiBankCardFill,
	RiBankCardLine,
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
import type {
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
import { Button } from "@/components/ui/button";
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
	"change-password": "Change password",
	"payment-method": "Payment method",
	"billing-history": "Billing History",
	"invite-member": "Invite new member",
	"review-invitations": "Review invitations",
};

const settingsSections: SettingsSection[] = [
	{ id: "account", label: "Account", icon: RiUserLine, activeIcon: RiUserFill },
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
		useState<SettingsSectionId>("account");
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
	const handleSettingsSubViewBack = () => {
		if (activeSettingsSubView === "review-invitations") {
			setActiveSettingsSubView("invite-member");
			return;
		}

		setActiveSettingsSubView(null);
	};
	const selectedSettingsSectionLabel = visibleSettingsSections.find(
		({ id }) => id === selectedSettingsSection,
	)?.label;

	function getSettingsBackButtonLabel() {
		if (activeSettingsSubView === "change-password") {
			return "Back to account settings";
		}

		if (activeSettingsSubView === "billing-history" || activeSettingsSubView === "payment-method") {
			return "Back to billing settings";
		}

		if (activeSettingsSubView === "invite-member") {
			return "Back to manage members";
		}

		if (activeSettingsSubView === "review-invitations") {
			return "Back to invite new member";
		}

		return "Back to settings";
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex h-full max-w-[80rem] flex-col overflow-hidden p-0">
				<div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
					<DialogTitle>Settings</DialogTitle>
					<DialogDescription className="sr-only">
						Manage your Medibridge account and organization settings.
					</DialogDescription>
					<DialogClose asChild>
						<Button variant="ghost" size="icon" aria-label="Close settings">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DialogClose>
				</div>
				<div className="flex min-h-0 flex-1">
					<aside className="w-[12.5rem] shrink-0 border-r bg-white p-2">
						<nav aria-label="Settings sections" className="flex flex-col gap-px">
							{visibleSettingsSections.map(({ id, label, icon: Icon, activeIcon: ActiveIcon }) => (
								<Button
									variant="ghost"
									key={id}
									type="button"
									className={cn(
										"flex h-8 w-full rounded-lg px-2.5 text-left justify-start py-0 font-normal has-[>svg:first-child]:pl-2.5",
										selectedSettingsSection === id
											? "bg-gray-200 font-medium text-gray-800 hover:bg-gray-200 hover:text-gray-800"
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
								</Button>
							))}
						</nav>
					</aside>

					<section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
						<h2 className="sr-only">
							{activeSettingsSubView
								? settingsSubViewLabels[activeSettingsSubView]
								: selectedSettingsSectionLabel}
						</h2>
						<div className="flex-1 overflow-y-auto">
							{activeSettingsSubView ? (
								<div className="px-4 pt-5">
									<Button
										variant="ghost"
										size="sm"
										type="button"
										className="text-gray-600 hover:bg-gray-100 hover:text-gray-800"
										aria-label={getSettingsBackButtonLabel()}
										onClick={handleSettingsSubViewBack}
									>
										<RiArrowLeftLine aria-hidden="true" />
										Back
									</Button>
								</div>
							) : null}
							{selectedSettingsSection === "account" ? (
								<AccountSettings
									user={user}
									viewerRole={
										activeMemberRole?.role === "owner" ||
										activeMemberRole?.role === "admin" ||
										activeMemberRole?.role === "member"
											? activeMemberRole.role
											: null
									}
									organizationName={activeOrganization?.name ?? null}
									organizationId={activeOrganization?.id ?? null}
									activeSettingsSubView={activeSettingsSubView}
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
