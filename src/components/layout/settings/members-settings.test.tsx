import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { MembersSettings } from "./members-settings";

const currentUser = {
	name: "Current User",
	email: "current@example.com",
};

describe("MembersSettings", () => {
	test("lets an owner manage admins and members", async () => {
		const user = userEvent.setup();
		render(
			<MembersSettings
				activeSettingsSubView={null}
				currentUser={currentUser}
				onSettingsSubViewChange={vi.fn()}
				pendingInvitations={[]}
				viewerRole="owner"
			/>,
		);

		const adminSummaryButton = screen.getByRole("button", { name: /Sarah Williams/i });
		const adminDetailsId = adminSummaryButton.getAttribute("aria-controls");
		const adminDetails = document.getElementById(adminDetailsId!);

		const currentUserName = screen.getByText("Current User");
		expect(currentUserName).toBeVisible();
		const currentUserCard = currentUserName.closest("article");
		expect(currentUserCard).not.toBeNull();
		expect(
			within(currentUserCard!).queryByRole("button", { hidden: true }),
		).not.toBeInTheDocument();
		expect(screen.getAllByRole("combobox", { name: /^Role for / })).toHaveLength(2);
		expect(screen.getByRole("combobox", { name: "Role for Sarah Williams" })).toHaveTextContent(
			"Admin",
		);
		expect(screen.getByRole("combobox", { name: "Role for David Okafor" })).toHaveTextContent(
			"Member",
		);
		expect(screen.getAllByRole("button", { name: "Remove member" })).toHaveLength(2);
		expect(adminSummaryButton).toHaveAttribute("aria-expanded", "true");
		expect(adminDetails).toHaveAttribute("aria-hidden", "false");

		await user.click(adminSummaryButton);

		expect(adminSummaryButton).toHaveAccessibleName(/View more/i);
		expect(adminSummaryButton).toHaveAttribute("aria-expanded", "false");
		expect(adminDetails).toHaveAttribute("aria-hidden", "true");
		expect(adminDetails).toHaveAttribute("inert");
	});

	test("lets an admin manage other admins and members, but not the owner or themselves", () => {
		render(
			<MembersSettings
				activeSettingsSubView={null}
				currentUser={currentUser}
				onSettingsSubViewChange={vi.fn()}
				pendingInvitations={[]}
				viewerRole="admin"
			/>,
		);

		for (const name of ["John Doe", "Current User"]) {
			const memberName = screen.getByText(name);
			expect(memberName).toBeVisible();
			const memberCard = memberName.closest("article");
			expect(memberCard).not.toBeNull();
			expect(within(memberCard!).queryByRole("button", { hidden: true })).not.toBeInTheDocument();
		}
		expect(screen.getByRole("combobox", { name: "Role for Michael Chen" })).toHaveTextContent(
			"Admin",
		);
		expect(screen.getByRole("combobox", { name: "Role for David Okafor" })).toHaveTextContent(
			"Member",
		);
		expect(screen.getAllByRole("button", { name: "Remove member" })).toHaveLength(2);
	});

	test("lets an admin manage admin and member invitations", () => {
		render(
			<MembersSettings
				activeSettingsSubView={null}
				currentUser={currentUser}
				onSettingsSubViewChange={vi.fn()}
				viewerRole="admin"
				pendingInvitations={[
					{
						id: "admin-invitation",
						email: "invited-admin@example.com",
						role: "admin",
						status: "pending",
						sentAt: "Aug 15, 2026",
						expiresAt: "Aug 24, 2026",
					},
					{
						id: "member-invitation",
						email: "invited-member@example.com",
						role: "member",
						status: "pending",
						sentAt: "Aug 15, 2026",
						expiresAt: "Aug 24, 2026",
					},
				]}
			/>,
		);

		const adminEmail = screen.getByText("invited-admin@example.com");
		const memberEmail = screen.getByText("invited-member@example.com");
		expect(adminEmail).toBeVisible();
		expect(memberEmail).toBeVisible();

		const adminCard = adminEmail.closest("article");
		const memberCard = memberEmail.closest("article");
		expect(adminCard).not.toBeNull();
		expect(memberCard).not.toBeNull();
		for (const invitationCard of [adminCard!, memberCard!]) {
			expect(
				within(invitationCard).getByRole("button", { name: "Resend invitation" }),
			).toBeEnabled();
			expect(
				within(invitationCard).getByRole("button", { name: "Cancel invitation" }),
			).toBeEnabled();
		}
	});
});
