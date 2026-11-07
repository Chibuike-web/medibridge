export type SettingsSectionId = "account" | "appearance" | "billing" | "members";

export type OrganizationRole = "owner" | "admin" | "member";

export type MemberManagerRole = Exclude<OrganizationRole, "member">;

export type InviteMemberRow = {
	id: string;
	email: string;
	role: Exclude<OrganizationRole, "owner"> | "";
};

export type SettingsSubView = "change-password";

export type SettingsDialogUser = {
	name: string;
	email: string;
	image?: string | null;
};
