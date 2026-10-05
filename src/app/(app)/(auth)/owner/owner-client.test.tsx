import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { OwnerClient } from "./owner-client";

const { sendVerificationEmailMock, signUpEmailMock } = vi.hoisted(() => ({
	sendVerificationEmailMock: vi.fn(),
	signUpEmailMock: vi.fn(),
}));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		signUp: { email: signUpEmailMock },
		sendVerificationEmail: sendVerificationEmailMock,
	},
}));

async function submitOwnerForm({
	email = "sarah@stmary.org",
	password = "secure-password",
}: { email?: string; password?: string } = {}) {
	const user = userEvent.setup();
	render(<OwnerClient />);

	await user.type(screen.getByRole("textbox", { name: "Name" }), "Sarah Thompson");
	await user.type(screen.getByRole("textbox", { name: "Email" }), email);
	await user.type(screen.getByLabelText("Password"), password);
	await user.click(screen.getByRole("button", { name: "Continue" }));

	return user;
}

describe("OwnerClient", () => {
	beforeEach(() => {
		signUpEmailMock.mockResolvedValue({ data: { token: null }, error: null });
		sendVerificationEmailMock.mockResolvedValue({ data: { status: true }, error: null });
	});

	test("creates an owner account and tells them to verify email before hospital setup", async () => {
		await submitOwnerForm();

		expect(await screen.findByRole("heading", { name: "Check your email" })).toBeVisible();
		expect(screen.getByRole("status")).toHaveTextContent(
			"We sent a verification link to sarah@stmary.org. Open it to add your hospital details.",
		);
		expect(signUpEmailMock).toHaveBeenCalledWith({
			name: "Sarah Thompson",
			email: "sarah@stmary.org",
			password: "secure-password",
			callbackURL: "/email-verified",
		});
	});

	test("hides the account setup form once the verification link is sent", async () => {
		await submitOwnerForm();

		expect(await screen.findByRole("heading", { name: "Check your email" })).toBeVisible();
		expect(screen.queryByRole("heading", { name: "Owner Account Setup" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
	});

	test("resends the verification link to the same address and confirms it was sent", async () => {
		const user = await submitOwnerForm();

		await user.click(await screen.findByRole("button", { name: "Resend link" }));

		expect(await screen.findByText("We sent a new link to sarah@stmary.org.")).toBeVisible();
		expect(sendVerificationEmailMock).toHaveBeenCalledWith({
			email: "sarah@stmary.org",
			callbackURL: "/email-verified",
		});
	});

	test("does not claim a new link was sent when resending fails", async () => {
		sendVerificationEmailMock.mockResolvedValue({
			data: null,
			error: { status: 429, message: "Too many requests" },
		});
		const user = await submitOwnerForm();

		await user.click(await screen.findByRole("button", { name: "Resend link" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Too many attempts. Wait a moment and try again.",
		);
		expect(screen.queryByText("We sent a new link to sarah@stmary.org.")).not.toBeInTheDocument();
	});

	test("lets the owner go back to correct their email with their details still filled in", async () => {
		const user = await submitOwnerForm();

		await user.click(await screen.findByRole("button", { name: "Go back" }));

		const emailField = screen.getByRole("textbox", { name: "Email" });
		expect(screen.getByRole("heading", { name: "Owner Account Setup" })).toBeVisible();
		expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Sarah Thompson");
		expect(emailField).toHaveValue("sarah@stmary.org");
		expect(emailField).toHaveFocus();
	});

	test("offers a sign-in link from the verification screen", async () => {
		await submitOwnerForm();

		expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute(
			"href",
			"/sign-in",
		);
	});

	test("tells the owner to sign in when their email already has an account", async () => {
		signUpEmailMock.mockResolvedValue({
			data: null,
			error: {
				status: 422,
				code: "USER_ALREADY_EXISTS",
				message: "This email already has an account.",
			},
		});

		await submitOwnerForm();

		const emailField = screen.getByRole("textbox", { name: "Email" });
		expect(
			await screen.findByText("This email already has an account. Sign in instead."),
		).toBeVisible();
		expect(emailField).toBeInvalid();
		expect(emailField).toHaveAccessibleDescription(
			"This email already has an account. Sign in instead.",
		);
		expect(screen.queryByRole("heading", { name: "Check your email" })).not.toBeInTheDocument();
	});

	test("tells the owner the password rule before they submit", () => {
		render(<OwnerClient />);

		expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
			"Use 8 to 128 characters.",
		);
	});

	test("does not create an account with a password shorter than 8 characters", async () => {
		await submitOwnerForm({ password: "1234567" });

		const passwordField = screen.getByLabelText("Password");
		expect(await screen.findByText("Password must be at least 8 characters")).toBeVisible();
		expect(passwordField).toBeInvalid();
		expect(passwordField).toHaveAccessibleDescription("Password must be at least 8 characters");
		expect(signUpEmailMock).not.toHaveBeenCalled();
	});

	test("creates an account with an 8-character password", async () => {
		await submitOwnerForm({ password: "12345678" });

		expect(await screen.findByRole("heading", { name: "Check your email" })).toBeVisible();
		expect(signUpEmailMock).toHaveBeenCalledWith(expect.objectContaining({ password: "12345678" }));
	});

	test("accepts an official .org email typed in capitals and sends it in lowercase", async () => {
		await submitOwnerForm({ email: "SARAH@STMARY.ORG" });

		expect(await screen.findByRole("heading", { name: "Check your email" })).toBeVisible();
		expect(signUpEmailMock).toHaveBeenCalledWith(
			expect.objectContaining({ email: "sarah@stmary.org" }),
		);
	});

	test("keeps the owner form available and shows the account-creation error", async () => {
		signUpEmailMock.mockResolvedValue({
			data: null,
			error: { status: 400, message: "Password too short" },
		});

		await submitOwnerForm();

		expect(await screen.findByRole("alert")).toHaveTextContent("Password too short");
		expect(await screen.findByRole("button", { name: "Continue" })).toBeEnabled();
		expect(screen.queryByRole("heading", { name: "Check your email" })).not.toBeInTheDocument();
	});

	test("asks the owner to wait when sign-up attempts are rate limited", async () => {
		signUpEmailMock.mockResolvedValue({
			data: null,
			error: { status: 429, message: "Too many requests. Please try again later." },
		});

		await submitOwnerForm();

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Too many attempts. Wait a moment and try again.",
		);
		expect(screen.queryByRole("heading", { name: "Check your email" })).not.toBeInTheDocument();
	});
});
