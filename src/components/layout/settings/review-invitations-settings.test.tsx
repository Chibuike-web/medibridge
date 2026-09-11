import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { ReviewInvitationsSettings } from "./review-invitations-settings";
import type { InviteMemberRow } from "./types";

const invitations: InviteMemberRow[] = Array.from({ length: 6 }, (_, index) => ({
	id: `invitation-${index + 1}`,
	email: `member${index + 1}@example.com`,
	role: "member",
}));

describe("ReviewInvitationsSettings", () => {
	test("expands and collapses the invitation preview while keeping the full send count", async () => {
		const user = userEvent.setup();
		render(<ReviewInvitationsSettings inviteMemberRows={invitations} onCancel={vi.fn()} />);

		for (const invitation of invitations.slice(0, 5)) {
			expect(screen.getByText(invitation.email)).toBeVisible();
		}
		expect(screen.queryByText(invitations[5].email)).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Send 6 invitations" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "View all 6 invitations" }));

		for (const invitation of invitations) {
			expect(screen.getByText(invitation.email)).toBeVisible();
		}
		expect(screen.queryByRole("button", { name: /View all/i })).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "View less" }));

		for (const invitation of invitations.slice(0, 5)) {
			expect(screen.getByText(invitation.email)).toBeVisible();
		}
		expect(screen.queryByText(invitations[5].email)).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "View all 6 invitations" })).toBeVisible();
		expect(screen.getByRole("button", { name: "Send 6 invitations" })).toBeVisible();
	});

	test.each([1, 5])("shows all %i invitations without an expansion control", (count) => {
		const visibleInvitations = invitations.slice(0, count);
		render(<ReviewInvitationsSettings inviteMemberRows={visibleInvitations} onCancel={vi.fn()} />);

		for (const invitation of visibleInvitations) {
			expect(screen.getByText(invitation.email)).toBeVisible();
		}
		expect(screen.queryByRole("button", { name: /View all|View less/i })).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: count === 1 ? "Send 1 invitation" : "Send 5 invitations",
			}),
		).toBeVisible();
	});
});
