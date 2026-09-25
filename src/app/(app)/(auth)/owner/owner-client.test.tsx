import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { OwnerClient } from "./owner-client";

const { signUpEmailMock } = vi.hoisted(() => ({ signUpEmailMock: vi.fn() }));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: { signUp: { email: signUpEmailMock } },
}));

async function submitOwnerForm() {
	const user = userEvent.setup();
	render(<OwnerClient />);

	await user.type(screen.getByRole("textbox", { name: "Name" }), "Sarah Thompson");
	await user.type(screen.getByRole("textbox", { name: "Email" }), "sarah@stmary.org");
	await user.type(screen.getByLabelText("Password"), "secure-password");
	await user.click(screen.getByRole("button", { name: "Continue" }));
}

describe("OwnerClient", () => {
	beforeEach(() => {
		signUpEmailMock.mockResolvedValue({ data: { token: null }, error: null });
	});

	test("creates an owner account and tells them to verify email before hospital setup", async () => {
		await submitOwnerForm();

		expect(await screen.findByRole("heading", { name: "Check your email" })).toBeVisible();
		expect(
			screen.getByText(/After verifying your email, you can add your hospital details/),
		).toBeVisible();
		expect(signUpEmailMock).toHaveBeenCalledWith({
			name: "Sarah Thompson",
			email: "sarah@stmary.org",
			password: "secure-password",
			callbackURL: "/hospital-details",
		});
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
