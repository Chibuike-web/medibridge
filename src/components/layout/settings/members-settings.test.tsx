import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { MembersSettings } from "./members-settings";

const currentUser = {
	name: "Current User",
	email: "current@example.com",
};

describe("MembersSettings", () => {
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

	test("lets an owner manage other members but not their own row", () => {
		render(
			<MembersSettings
				currentUser={currentUser}
				organizationName="Lagos General"
				viewerRole="owner"
			/>,
		);

		const ownRow = screen.getByRole("row", { name: /Current User/ });
		expect(ownRow).toBeVisible();
		expect(within(ownRow).queryByRole("button")).not.toBeInTheDocument();
		expect(within(ownRow).queryByRole("combobox")).not.toBeInTheDocument();

		const adminRow = screen.getByRole("row", { name: /Sarah Williams/ });
		expect(
			within(adminRow).getByRole("combobox", { name: "Role for Sarah Williams" }),
		).toHaveTextContent("Admin");
		expect(
			within(adminRow).getByRole("button", { name: "Open actions for Sarah Williams" }),
		).toBeEnabled();
	});

	test("lets an admin manage other admins and members, but not the owner or themselves", () => {
		render(
			<MembersSettings
				currentUser={currentUser}
				organizationName="Lagos General"
				viewerRole="admin"
			/>,
		);

		for (const name of [/John Doe/, /Current User/]) {
			const row = screen.getByRole("row", { name });
			expect(row).toBeVisible();
			expect(within(row).queryByRole("button")).not.toBeInTheDocument();
			expect(within(row).queryByRole("combobox")).not.toBeInTheDocument();
		}

		for (const name of ["Sarah Williams", "David Okafor"]) {
			const row = screen.getByRole("row", { name: new RegExp(name) });
			expect(within(row).getByRole("combobox", { name: `Role for ${name}` })).toBeEnabled();
			expect(within(row).getByRole("button", { name: `Open actions for ${name}` })).toBeEnabled();
		}
	});

	test.each([
		["David Okafor", ["Remove member"]],
		["grace@example.com", ["Copy link", "Resend invitation", "Cancel invitation"]],
		["tunde@example.com", ["Remove invitation"]],
	])("offers the actions that fit %s's invite status", async (rowLabel, actions) => {
		const user = userEvent.setup();
		render(
			<MembersSettings
				currentUser={currentUser}
				organizationName="Lagos General"
				viewerRole="owner"
			/>,
		);

		await user.click(screen.getByRole("button", { name: `Open actions for ${rowLabel}` }));

		expect(screen.getAllByRole("menuitem").map((menuItem) => menuItem.textContent)).toEqual(
			actions,
		);
	});

	test("finds a member by email", async () => {
		const user = userEvent.setup();
		render(
			<MembersSettings
				currentUser={currentUser}
				organizationName="Lagos General"
				viewerRole="owner"
			/>,
		);

		await user.type(screen.getByRole("searchbox", { name: "Search members" }), "david@");

		expect(screen.getByRole("row", { name: /David Okafor/ })).toBeVisible();
		expect(screen.queryByRole("row", { name: /Sarah Williams/ })).not.toBeInTheDocument();
	});

	test("shows a role filter as a pill that brings every member back when removed", async () => {
		const user = userEvent.setup();
		render(
			<MembersSettings
				currentUser={currentUser}
				organizationName="Lagos General"
				viewerRole="owner"
			/>,
		);

		await user.click(screen.getByRole("button", { name: /^Filters/ }));
		await user.click(screen.getByRole("radio", { name: "Admin" }));
		await user.keyboard("{Escape}");

		expect(screen.getByRole("row", { name: /Sarah Williams/ })).toBeVisible();
		expect(screen.queryByRole("row", { name: /David Okafor/ })).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Remove Role: Admin filter" }));

		expect(screen.getByRole("row", { name: /David Okafor/ })).toBeVisible();
		expect(
			screen.queryByRole("button", { name: "Remove Role: Admin filter" }),
		).not.toBeInTheDocument();
	});

	test("does not review an invitation with an invalid email", async () => {
		const user = userEvent.setup();
		render(
			<MembersSettings
				currentUser={currentUser}
				organizationName="Lagos General"
				viewerRole="owner"
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Invite member" }));
		const emailInput = screen.getByRole("textbox", { name: /Email address/ });
		await user.type(emailInput, "not-an-email");
		await user.click(screen.getByRole("button", { name: "Continue" }));

		expect(emailInput).toBeInvalid();
		expect(screen.queryByRole("dialog", { name: "Review invitations" })).not.toBeInTheDocument();
	});

	test("reviews and sends an invitation", async () => {
		const user = userEvent.setup();
		render(
			<MembersSettings
				currentUser={currentUser}
				organizationName="Lagos General"
				viewerRole="owner"
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Invite member" }));
		await user.type(screen.getByRole("textbox", { name: /Email address/ }), "new@example.com");
		await user.click(screen.getByRole("combobox", { name: /Role/ }));
		await user.click(screen.getByRole("option", { name: "Member" }));
		await user.click(screen.getByRole("button", { name: "Continue" }));

		const reviewDialog = await screen.findByRole("dialog", { name: "Review invitations" });
		expect(within(reviewDialog).getByText("new@example.com")).toBeVisible();
		expect(within(reviewDialog).getByText("member")).toBeVisible();

		await user.click(within(reviewDialog).getByRole("button", { name: "Send 1 invitation" }));

		expect(await screen.findByRole("dialog", { name: "Invitation sent" })).toBeVisible();
	});
});
