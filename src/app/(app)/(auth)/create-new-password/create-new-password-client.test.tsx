import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { CreateNewPasswordClient } from "./create-new-password-client";
import PasswordResetSuccess from "./success/page";

const { redirectMock, resetPasswordMock } = vi.hoisted(() => ({
	redirectMock: vi.fn(),
	resetPasswordMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: { resetPassword: resetPasswordMock },
}));

describe("password reset completion", () => {
	beforeEach(() => {
		resetPasswordMock.mockResolvedValue({ error: null });
	});

	test("confirms reset only after the reset request succeeds", async () => {
		const user = userEvent.setup();
		render(<CreateNewPasswordClient token="valid-reset-token" isTokenInvalid={false} />);

		await user.type(screen.getByLabelText("New Password"), "secure12");
		await user.type(screen.getByLabelText("Confirm New Password"), "secure12");
		await user.click(screen.getByRole("button", { name: "Reset Password" }));

		expect(await screen.findByText("You have successfully created a new password")).toBeVisible();
		expect(screen.getByRole("link", { name: "Continue to sign in" })).toHaveAttribute(
			"href",
			"/sign-in",
		);
	});

	test("shows a field error for mismatched passwords without submitting the reset", async () => {
		const user = userEvent.setup();
		render(<CreateNewPasswordClient token="valid-reset-token" isTokenInvalid={false} />);

		await user.type(screen.getByLabelText("New Password"), "secure12");
		await user.type(screen.getByLabelText("Confirm New Password"), "different");
		await user.click(screen.getByRole("button", { name: "Reset Password" }));

		const confirmationPassword = screen.getByLabelText("Confirm New Password");
		expect(confirmationPassword).toHaveAttribute("aria-invalid", "true");
		expect(confirmationPassword).toHaveAccessibleDescription("Passwords do not match.");
		expect(resetPasswordMock).not.toHaveBeenCalled();
	});

	test("does not claim a direct visit to the old success URL completed a reset", () => {
		PasswordResetSuccess();

		expect(redirectMock).toHaveBeenCalledWith("/sign-in");
	});

	test.each([
		[
			{ status: 500, code: "INTERNAL_SERVER_ERROR" },
			"We couldn’t reset your password. Please try again.",
		],
		[{ status: 429 }, "Too many attempts. Wait a moment and try again."],
	])(
		"keeps a valid reset link usable after a temporary request failure (%j)",
		async (error, message) => {
			const user = userEvent.setup();
			resetPasswordMock.mockResolvedValueOnce({ error });
			render(<CreateNewPasswordClient token="valid-reset-token" isTokenInvalid={false} />);

			await user.type(screen.getByLabelText("New Password"), "secure12");
			await user.type(screen.getByLabelText("Confirm New Password"), "secure12");
			await user.click(screen.getByRole("button", { name: "Reset Password" }));

			expect(await screen.findByRole("alert")).toHaveTextContent(message);
			expect(screen.getByLabelText("New Password")).toHaveValue("secure12");
			await user.click(screen.getByRole("button", { name: "Reset Password" }));
			expect(await screen.findByText("You have successfully created a new password")).toBeVisible();
		},
	);

	test("offers a new link when the token expires after the form loads", async () => {
		const user = userEvent.setup();
		resetPasswordMock.mockResolvedValue({ error: { status: 400, code: "INVALID_TOKEN" } });
		render(<CreateNewPasswordClient token="expired-reset-token" isTokenInvalid={false} />);

		await user.type(screen.getByLabelText("New Password"), "secure12");
		await user.type(screen.getByLabelText("Confirm New Password"), "secure12");
		await user.click(screen.getByRole("button", { name: "Reset Password" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"This password reset link is invalid or expired.",
		);
		expect(screen.getByRole("link", { name: "Request a new reset link" })).toHaveAttribute(
			"href",
			"/forgot-password",
		);
	});
});
