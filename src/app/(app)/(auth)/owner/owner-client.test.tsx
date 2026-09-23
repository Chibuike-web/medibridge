import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { OwnerClient } from "./owner-client";

const { createOwnerActionMock } = vi.hoisted(() => ({ createOwnerActionMock: vi.fn() }));

vi.mock("@/features/auth/server/actions", () => ({ createOwnerAction: createOwnerActionMock }));

describe("OwnerClient", () => {
	beforeEach(() => {
		createOwnerActionMock.mockResolvedValue({
			status: "success",
			message: "Verification email sent",
		});
	});

	test("creates an owner account and tells them to verify email before hospital setup", async () => {
		const user = userEvent.setup();
		render(<OwnerClient />);

		await user.type(screen.getByRole("textbox", { name: "Name" }), "Sarah Thompson");
		await user.type(screen.getByRole("textbox", { name: "Email" }), "sarah@stmary.org");
		await user.type(screen.getByLabelText("Password"), "secure-password");
		await user.click(screen.getByRole("button", { name: "Continue" }));

		expect(await screen.findByRole("heading", { name: "Check your email" })).toBeVisible();
		expect(
			screen.getByText(/After verifying your email, you can add your hospital details/),
		).toBeVisible();
		expect(createOwnerActionMock).toHaveBeenCalledWith({
			name: "Sarah Thompson",
			email: "sarah@stmary.org",
			password: "secure-password",
		});
	});

	test("keeps the owner form available and shows the account-creation error", async () => {
		createOwnerActionMock.mockResolvedValue({
			status: "failed",
			error: "An account already exists with this email.",
		});
		const user = userEvent.setup();
		render(<OwnerClient />);

		await user.type(screen.getByRole("textbox", { name: "Name" }), "Sarah Thompson");
		await user.type(screen.getByRole("textbox", { name: "Email" }), "sarah@stmary.org");
		await user.type(screen.getByLabelText("Password"), "secure-password");
		await user.click(screen.getByRole("button", { name: "Continue" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"An account already exists with this email.",
		);
		expect(await screen.findByRole("button", { name: "Continue" })).toBeEnabled();
	});
});
