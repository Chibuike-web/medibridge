export type SettingsSectionId = "profile" | "account" | "appearance" | "billing" | "members";

export type SettingsSubView =
	| "organization"
	| "active-session"
	| "change-password"
	| "payment-method"
	| "billing-history";

export type ChangePasswordView = "change-password" | "verify-your-identity" | "enter-new-password";

export type SettingsDialogUser = {
	name: string;
	email: string;
	image?: string | null;
};
