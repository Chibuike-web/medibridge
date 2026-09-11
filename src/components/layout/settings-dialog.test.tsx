import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { SettingsDialog } from "./settings-dialog";

// Keep all settings components real; only replace the external auth data source.
const { roleMock, organizationMock } = vi.hoisted(() => ({
	roleMock: vi.fn(),
	organizationMock: vi.fn(),
}));
vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: { useActiveMemberRole: roleMock, useActiveOrganization: organizationMock },
}));
const props = {
	open: true,
	onOpenChange: vi.fn(),
	user: { name: "Current User", email: "current@example.com" },
};

describe("SettingsDialog", () => {
	const scrollDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
	beforeAll(() => {
		// Radix scrolls focused options; jsdom has no layout or scrolling implementation.
		Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
			configurable: true,
			value: vi.fn(),
		});
	});
	afterAll(() => {
		if (scrollDescriptor)
			Object.defineProperty(HTMLElement.prototype, "scrollIntoView", scrollDescriptor);
		else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
	});
	beforeEach(() => {
		roleMock.mockReturnValue({ data: { role: "owner" } });
		organizationMock.mockReturnValue({ data: { name: "Test Hospital" } });
	});

	test.each(["member", null])("hides organization sections for role %s", async (role) => {
		roleMock.mockReturnValue({ data: role ? { role } : null });
		const user = userEvent.setup();
		render(<SettingsDialog {...props} />);
		const navigation = within(screen.getByRole("navigation", { name: "Settings sections" }));
		expect(navigation.getByRole("button", { name: "Profile" })).toBeVisible();
		expect(navigation.queryByRole("button", { name: "Billing" })).not.toBeInTheDocument();
		expect(navigation.queryByRole("button", { name: "Manage members" })).not.toBeInTheDocument();
	});

	test.each([
		{ role: null, organization: { name: "Test Hospital" } },
		{ role: "member", organization: null },
	])(
		"prevents deletion without complete organization context: %j",
		async ({ role, organization }) => {
			roleMock.mockReturnValue({ data: role ? { role } : null });
			organizationMock.mockReturnValue({ data: organization });
			const user = userEvent.setup();
			render(<SettingsDialog {...props} />);
			await user.click(screen.getByRole("button", { name: "Account" }));
			const deleteButton = screen.getByRole("button", { name: "Delete account" });
			expect(deleteButton).toBeDisabled();
			await user.click(deleteButton);
			expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
		},
	);

	test("opening Account does not announce a password change", async () => {
		// Regression: Account previously initialized its password-success dialog as open.
		const user = userEvent.setup();
		render(<SettingsDialog {...props} />);
		await user.click(screen.getByRole("button", { name: "Account" }));
		expect(screen.getByRole("button", { name: "Delete account" })).toBeVisible();
		expect(screen.queryByRole("dialog", { name: "Password changed" })).not.toBeInTheDocument();
	});

	test.each(["owner", "admin"])("allows %s to open Billing and Manage members", async (role) => {
		roleMock.mockReturnValue({ data: { role } });
		const user = userEvent.setup();
		render(<SettingsDialog {...props} />);
		await user.click(screen.getByRole("button", { name: "Billing" }));
		expect(screen.getByRole("heading", { name: "Billing" })).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Manage members" }));
		expect(screen.getByRole("button", { name: "Invite new member" })).toBeVisible();
	});

	test.each(["owner", "admin", "member"])(
		"opens the deletion dialog for the signed-in %s",
		async (role) => {
			roleMock.mockReturnValue({ data: { role } });
			const user = userEvent.setup();
			render(<SettingsDialog {...props} />);
			await user.click(screen.getByRole("button", { name: "Account" }));
			await user.click(screen.getByRole("button", { name: "Delete account" }));
			const dialog = within(
				screen.getByRole("alertdialog", {
					name:
						role === "owner"
							? "Transfer ownership before deleting your account"
							: "Are you sure you want to delete your account?",
				}),
			);
			expect(dialog.getAllByText(/Test Hospital/)[0]).toBeVisible();
		},
	);

	test("preserves the invitation email and role when returning from review", async () => {
		const user = userEvent.setup();
		render(<SettingsDialog {...props} />);
		await user.click(screen.getByRole("button", { name: "Manage members" }));
		await user.click(screen.getByRole("button", { name: "Invite new member" }));
		await user.click(screen.getByRole("textbox", { name: /Email address/ }));
		await user.paste("invite@example.com");
		await user.tab();
		expect(screen.getByRole("combobox", { name: /Role/ })).toHaveFocus();
		await user.keyboard("{Enter}");
		await user.click(screen.getByRole("option", { name: "Admin" }));
		await user.click(screen.getByRole("button", { name: "Review invitations" }));
		expect(screen.getByText("invite@example.com")).toBeVisible();
		expect(screen.getByRole("heading", { name: "Review invitations" })).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Back to invite new member" }));
		expect(screen.getByRole("textbox", { name: /Email address/ })).toHaveValue(
			"invite@example.com",
		);
		expect(screen.getByRole("combobox", { name: /Role/ })).toHaveTextContent("Admin");
		expect(screen.getAllByRole("textbox", { name: /Email address/ })).toHaveLength(1);
	});
});
