import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { EmailVerifiedClient } from "./email-verified-client";

const { searchParamsState, sendVerificationEmailMock, useSessionMock } = vi.hoisted(() => ({
	searchParamsState: { query: "" },
	sendVerificationEmailMock: vi.fn(),
	useSessionMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams(searchParamsState.query),
}));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		sendVerificationEmail: sendVerificationEmailMock,
		useSession: useSessionMock,
	},
}));

describe("EmailVerifiedClient", () => {
	beforeEach(() => {
		searchParamsState.query = "error=expired_token";
		useSessionMock.mockReturnValue({
			data: { user: { email: "sarah@stmary.org" } },
			isPending: false,
		});
		sendVerificationEmailMock.mockImplementation(async (_request, callbacks) => {
			callbacks.onSuccess();
			return { data: { status: true } };
		});
	});

	test("lets a signed-in user resend an expired verification link and confirms it was sent", async () => {
		const user = userEvent.setup();
		render(<EmailVerifiedClient />);

		await user.click(screen.getByRole("button", { name: "Resend verification email" }));

		expect(await screen.findByRole("status")).toHaveTextContent("Verification email sent.");
	});

	test.each([
		{ scenario: "a verified user", query: "", name: "Continue", href: "/" },
		{ scenario: "a signed-out user", query: "error=no_session", name: "Sign in", href: "/sign-in" },
		{ scenario: "an unverified user", query: "error=unverified", name: "Sign in", href: "/sign-in" },
	])("gives $scenario a single $name link instead of a link nested in a button", ({ query, name, href }) => {
		searchParamsState.query = query;
		render(<EmailVerifiedClient />);

		expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
		expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
	});
});
