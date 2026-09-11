import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { InviteMembersSettings } from "./invite-members-settings";
import { MembersSettings } from "./members-settings";
import { useState } from "react";
import type { SettingsSubView } from "./types";

function InvitationFlow() {
	const [activeSettingsSubView, setActiveSettingsSubView] = useState<SettingsSubView | null>(
		"invite-member",
	);
	return (
		<MembersSettings
			activeSettingsSubView={activeSettingsSubView}
			onSettingsSubViewChange={setActiveSettingsSubView}
			currentUser={{ name: "Current User", email: "current@example.com" }}
			pendingInvitations={[]}
			viewerRole="owner"
		/>
	);
}

describe("InviteMembersSettings", () => {
	const scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
		HTMLElement.prototype,
		"scrollIntoView",
	);

	beforeAll(() => {
		// jsdom has no scrolling layout; Radix calls this when focusing an option.
		Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
			configurable: true,
			value: vi.fn(),
		});
	});

	afterAll(() => {
		if (scrollIntoViewDescriptor) {
			Object.defineProperty(HTMLElement.prototype, "scrollIntoView", scrollIntoViewDescriptor);
		} else {
			Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
		}
	});

	test("updates one invitation email without changing another row", async () => {
		const user = userEvent.setup();
		render(
			<MembersSettings
				activeSettingsSubView="invite-member"
				currentUser={{ name: "Current User", email: "current@example.com" }}
				onSettingsSubViewChange={vi.fn()}
				pendingInvitations={[]}
				viewerRole="owner"
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Add another member" }));
		const emailInputs = screen.getAllByRole("textbox", { name: /Email address/i });
		await user.click(emailInputs[0]);
		await user.paste("first@example.com");
		await user.click(emailInputs[1]);
		await user.paste("second@example.com");
		await user.clear(emailInputs[0]);
		await user.paste("updated@example.com");

		expect(emailInputs[0]).toHaveValue("updated@example.com");
		expect(emailInputs[1]).toHaveValue("second@example.com");
	});

	test("removes the selected row while preserving the remaining email and the last row", async () => {
		const user = userEvent.setup();
		render(
			<MembersSettings
				activeSettingsSubView="invite-member"
				currentUser={{ name: "Current User", email: "current@example.com" }}
				onSettingsSubViewChange={vi.fn()}
				pendingInvitations={[]}
				viewerRole="owner"
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Add another member" }));
		const emailInputs = screen.getAllByRole("textbox", { name: /Email address/i });
		await user.click(emailInputs[0]);
		await user.paste("remove@example.com");
		await user.click(emailInputs[1]);
		await user.paste("keep@example.com");
		await user.click(screen.getByRole("button", { name: "Remove member 1" }));

		expect(screen.getAllByRole("textbox", { name: /Email address/i })).toHaveLength(1);
		expect(screen.queryByDisplayValue("remove@example.com")).not.toBeInTheDocument();
		expect(screen.getByDisplayValue("keep@example.com")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Remove member 1" }));

		expect(screen.getAllByRole("textbox", { name: /Email address/i })).toHaveLength(1);
		expect(screen.getByRole("textbox", { name: /Email address/i })).toHaveValue("keep@example.com");
	});

	test.each([
		{ viewerRole: "owner" as const, allowedRoles: ["Admin", "Member"] },
		{ viewerRole: "admin" as const, allowedRoles: ["Member"] },
	])(
		"shows only allowed invitation roles for $viewerRole",
		async ({ viewerRole, allowedRoles }) => {
			const user = userEvent.setup();
			render(
				<InviteMembersSettings
					inviteMemberRows={[{ id: "invitation-1", email: "", role: "" }]}
					setInviteMemberRows={vi.fn()}
					onAddInvitationRow={vi.fn()}
					onSettingsSubViewChange={vi.fn()}
					viewerRole={viewerRole}
				/>,
			);

			await user.tab();
			await user.tab();
			await user.tab();
			expect(screen.getByRole("combobox", { name: /Role/i })).toHaveFocus();
			await user.keyboard("{Enter}");

			expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(
				allowedRoles,
			);
		},
	);

	test("reviews an invitation, opens success on send, and returns to members on Done", async () => {
		const user = userEvent.setup();
		render(<InvitationFlow />);
		await user.click(screen.getByRole("textbox", { name: /Email address/i }));
		await user.paste("new@example.com");
		await user.tab();
		expect(screen.getByRole("combobox", { name: /Role/i })).toHaveFocus();
		await user.keyboard("{Enter}");
		await user.click(screen.getByRole("option", { name: "Admin" }));
		await user.click(screen.getByRole("button", { name: "Review invitations" }));
		expect(screen.getByText("new@example.com")).toBeVisible();
		expect(screen.getByText("admin")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Send 1 invitation" }));
		expect(screen.getByRole("dialog", { name: "Invitation sent" })).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Done" }));
		expect(screen.queryByRole("dialog", { name: "Invitation sent" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Invite new member" })).toBeVisible();
	});

	test.each(["", "invalid-email"])("does not review an invalid email: %s", async (email) => {
		const user = userEvent.setup();
		const onSettingsSubViewChange = vi.fn();
		render(
			<InviteMembersSettings
				inviteMemberRows={[{ id: "one", email, role: "member" }]}
				setInviteMemberRows={vi.fn()}
				onAddInvitationRow={vi.fn()}
				onSettingsSubViewChange={onSettingsSubViewChange}
				viewerRole="owner"
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Review invitations" }));
		expect(screen.getByRole("textbox", { name: /Email address/i })).toBeInvalid();
		expect(onSettingsSubViewChange).not.toHaveBeenCalled();
	});

	test("does not review an invitation without a role", async () => {
		const user = userEvent.setup();
		const onSettingsSubViewChange = vi.fn();
		render(
			<InviteMembersSettings
				inviteMemberRows={[{ id: "one", email: "new@example.com", role: "" }]}
				setInviteMemberRows={vi.fn()}
				onAddInvitationRow={vi.fn()}
				onSettingsSubViewChange={onSettingsSubViewChange}
				viewerRole="owner"
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Review invitations" }));
		expect(onSettingsSubViewChange).not.toHaveBeenCalled();
	});
});
