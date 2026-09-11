export type SettingsSectionId = "profile" | "account" | "appearance" | "billing" | "members";

export type OrganizationRole = "owner" | "admin" | "member";

export type MemberManagerRole = Exclude<OrganizationRole, "member">;

export type InviteMemberRow = {
	id: string;
	email: string;
	role: Exclude<OrganizationRole, "owner"> | "";
};

export type PendingInvitation = {
	id: string;
	name?: string;
	email: string;
	role: Exclude<OrganizationRole, "owner">;
	status: "pending" | "expired";
	sentAt: string;
	expiresAt: string;
};

export type SettingsSubView =
	| "organization"
	| "active-session"
	| "change-password"
	| "payment-method"
	| "billing-history"
	| "invite-member"
	| "review-invitations";

export type ChangePasswordView = "change-password" | "verify-your-identity" | "enter-new-password";

export type SettingsDialogUser = {
	name: string;
	email: string;
	image?: string | null;
};
