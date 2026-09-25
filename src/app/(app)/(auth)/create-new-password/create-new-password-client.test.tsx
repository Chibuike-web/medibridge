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
});
