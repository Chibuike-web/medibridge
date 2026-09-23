import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AdminInviteClient } from "./admin-invite-client";

const { inviteAdminActionMock, replaceMock } = vi.hoisted(() => ({
	inviteAdminActionMock: vi.fn(),
	replaceMock: vi.fn(),
}));

vi.mock("@/features/auth/server/actions", () => ({
	inviteAdminAction: inviteAdminActionMock,
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: replaceMock,
	}),
}));

describe("AdminInviteClient", () => {
	beforeEach(() => {
		inviteAdminActionMock.mockReset();
		replaceMock.mockReset();
	});

	test("shows field-specific errors and does not submit an empty invitation", async () => {
		const user = userEvent.setup();
		render(<AdminInviteClient />);

		await user.click(screen.getByRole("button", { name: "Send Invite" }));

		expect(await screen.findByText("Name is required")).toBeVisible();
		expect(screen.getByText("Email is required")).toBeVisible();
		expect(screen.getByRole("textbox", { name: "Name" })).toBeInvalid();
		expect(screen.getByRole("textbox", { name: "Email Address" })).toBeInvalid();
		expect(inviteAdminActionMock).not.toHaveBeenCalled();
	});

	test("rejects an administrator email outside the required hospital domain", async () => {
		const user = userEvent.setup();
		render(<AdminInviteClient />);

		await user.type(screen.getByRole("textbox", { name: "Name" }), "Sarah Thompson");
		await user.type(screen.getByRole("textbox", { name: "Email Address" }), "sarah@gmail.com");
		await user.click(screen.getByRole("button", { name: "Send Invite" }));

		expect(await screen.findByText("Email must end with .org")).toBeVisible();
		expect(inviteAdminActionMock).not.toHaveBeenCalled();
	});

	test("submits normalized administrator details and confirms the invitation", async () => {
		const user = userEvent.setup();
		inviteAdminActionMock.mockResolvedValue({ status: "success" });
		render(<AdminInviteClient />);

		await user.type(screen.getByRole("textbox", { name: "Name" }), " Sarah Thompson ");
		await user.type(
			screen.getByRole("textbox", { name: "Email Address" }),
			"SARAH@STMARYHOSPITAL.ORG",
		);
		await user.click(screen.getByRole("button", { name: "Send Invite" }));

		expect(inviteAdminActionMock).toHaveBeenCalledWith({
			name: "Sarah Thompson",
			email: "sarah@stmaryhospital.org",
		});
		expect(
			await screen.findByRole("dialog", { name: "Admin Invitation Sent" }),
		).toBeVisible();
	});
});
