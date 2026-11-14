export type SettingsSectionId = "account" | "appearance" | "billing" | "members";

export type OrganizationRole = "owner" | "admin" | "member";

export type MemberManagerRole = Exclude<OrganizationRole, "member">;

export type StaffType = "clinician" | "front_desk";

export type MemberAccess = {
	role: Exclude<OrganizationRole, "owner">;
	staffType: StaffType | null;
	departments: string[] | null;
	permissions: string[];
	mcpScopes: string[];
};

export type InviteMemberRow = {
	id: string;
	email: string;
	access: MemberAccess | null;
};

export type SettingsDialogUser = {
	name: string;
	email: string;
	image?: string | null;
};
