import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AcceptInviteClient } from "./accept-invite-client";

const {
	acceptInvitationMock,
	refreshMock,
	pushMock,
	sendVerificationEmailMock,
	signOutMock,
	signUpMock,
} = vi.hoisted(() => ({
	acceptInvitationMock: vi.fn(),
	refreshMock: vi.fn(),
	pushMock: vi.fn(),
	sendVerificationEmailMock: vi.fn(),
	signOutMock: vi.fn(),
	signUpMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock, push: pushMock }) }));
vi.mock("@/features/auth/server/actions", () => ({ acceptInvitationAction: acceptInvitationMock }));
vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		signUp: { email: signUpMock },
		sendVerificationEmail: sendVerificationEmailMock,
		signOut: signOutMock,
	},
}));

const invitation = {
	email: "sarah@stmary.org",
	invitationId: "invitation-1",
	organizationName: "St Mary",
};

describe("invitation continuation", () => {
	beforeEach(() => {
		acceptInvitationMock.mockResolvedValue({ status: "success" });
		sendVerificationEmailMock.mockResolvedValue({ error: null });
		signOutMock.mockResolvedValue({ error: null });
		signUpMock.mockResolvedValue({ error: null });
	});

	test("lets an existing invited account sign in while retaining the invitation", () => {
		render(<AcceptInviteClient {...invitation} mode="verify-email" />);

		expect(screen.getByRole("textbox", { name: "Email Address" })).toHaveValue(invitation.email);
		expect(screen.getByRole("link", { name: "Sign in to accept invitation" })).toHaveAttribute(
			"href",
			"/sign-in?callbackUrl=%2Faccept-invite%3FinvitationId%3Dinvitation-1",
		);
	});

	test.each(["create-account", "verify-email"] as const)(
		"keeps the invited email visible and skips it during keyboard navigation in %s mode",
		async (mode) => {
			const user = userEvent.setup();
			render(<AcceptInviteClient {...invitation} mode={mode} />);
			const invitedEmail = screen.getByRole("textbox", { name: "Email Address" });

			expect(invitedEmail).toHaveValue(invitation.email);
			expect(invitedEmail).toBeDisabled();
			expect(invitedEmail).toHaveAccessibleDescription("This email comes from your invitation");

			await user.tab();
			if (mode === "create-account") {
				expect(screen.getByRole("textbox", { name: "Name" })).toHaveFocus();
				await user.tab();
				expect(screen.getByLabelText("Password", { exact: true })).toHaveFocus();
			} else {
				expect(screen.getByRole("button", { name: "Resend verification email" })).toHaveFocus();
			}
		},
	);

	test("resends an unverified invitee a link with the original invitation", async () => {
		const user = userEvent.setup();
		render(<AcceptInviteClient {...invitation} mode="verify-email" />);
		await user.click(screen.getByRole("button", { name: "Resend verification email" }));

		expect(await screen.findByRole("status")).toHaveTextContent(
			"If your account is unverified, we sent a new verification link.",
		);
		expect(sendVerificationEmailMock).toHaveBeenCalledWith({
			email: invitation.email,
			callbackURL: "/accept-invite?invitationId=invitation-1",
		});
	});

	test("does not claim verification email delivery when resending is throttled", async () => {
		const user = userEvent.setup();
		sendVerificationEmailMock.mockResolvedValue({ error: { status: 429 } });
		render(<AcceptInviteClient {...invitation} mode="verify-email" />);
		await user.click(screen.getByRole("button", { name: "Resend verification email" }));

		expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts.");
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});

	test("joins the hospital only after verified acceptance succeeds", async () => {
		const user = userEvent.setup();
		render(<AcceptInviteClient {...invitation} mode="accept" />);
		await user.click(screen.getByRole("button", { name: "Accept invitation" }));

		expect(await screen.findByRole("dialog", { name: "Account Setup Complete" })).toHaveTextContent(
			"You have joined St Mary.",
		);
		await user.click(screen.getByRole("button", { name: "Continue to Dashboard" }));
		expect(pushMock).toHaveBeenCalledWith("/dashboard/overview");
	});

	test("keeps the invitation available when acceptance fails", async () => {
		const user = userEvent.setup();
		acceptInvitationMock.mockResolvedValue({
			status: "failed",
			error: "The hospital is not approved.",
		});
		render(<AcceptInviteClient {...invitation} mode="accept" />);
		await user.click(screen.getByRole("button", { name: "Accept invitation" }));

		expect(await screen.findByRole("alert")).toHaveTextContent("The hospital is not approved.");
		expect(screen.getByRole("button", { name: "Accept invitation" })).toBeEnabled();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(pushMock).not.toHaveBeenCalled();
	});

	test("changes account only after sign-out succeeds", async () => {
		const user = userEvent.setup();
		render(<AcceptInviteClient {...invitation} mode="wrong-account" />);
		await user.click(screen.getByRole("button", { name: "Switch account" }));

		await vi.waitFor(() => expect(refreshMock).toHaveBeenCalled());
	});

	test("shows a plain error and keeps the current account when sign-out fails", async () => {
		const user = userEvent.setup();
		signOutMock.mockResolvedValue({ error: { message: "secret database connection" } });
		render(<AcceptInviteClient {...invitation} mode="wrong-account" />);
		await user.click(screen.getByRole("button", { name: "Switch account" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Unable to sign out. Please try again.",
		);
		expect(refreshMock).not.toHaveBeenCalled();
	});
});
