import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { InviteMembersSettings } from "./invite-members-settings";

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

	test("offers the Admin and Member roles for an invitation", async () => {
		const user = userEvent.setup();
		render(
			<InviteMembersSettings
				inviteMemberRows={[{ id: "invitation-1", email: "", role: "" }]}
				setInviteMemberRows={vi.fn()}
				onAddInvitationRow={vi.fn()}
				onSettingsSubViewChange={vi.fn()}
			/>,
		);

		await user.tab();
		await user.tab();
		await user.tab();
		expect(screen.getByRole("combobox", { name: /Role/i })).toHaveFocus();
		await user.keyboard("{Enter}");

		expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
			"Admin",
			"Member",
		]);
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
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Review invitations" }));
		expect(onSettingsSubViewChange).not.toHaveBeenCalled();
	});
});
