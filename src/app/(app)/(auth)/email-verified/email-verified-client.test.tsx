import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { EmailVerifiedClient } from "./email-verified-client";

const { searchParamsState, sendVerificationEmailMock } = vi.hoisted(() => ({
	searchParamsState: { query: "" },
	sendVerificationEmailMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams(searchParamsState.query),
}));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		sendVerificationEmail: sendVerificationEmailMock,
	},
}));

async function requestNewLink(email: string) {
	const user = userEvent.setup();
	await user.type(screen.getByRole("textbox", { name: "Email Address" }), email);
	await user.click(screen.getByRole("button", { name: "Resend verification email" }));
}

describe("EmailVerifiedClient", () => {
	beforeEach(() => {
		searchParamsState.query = "error=TOKEN_EXPIRED";
		sendVerificationEmailMock.mockResolvedValue({ data: { status: true }, error: null });
	});

	test.each([
		{ code: "TOKEN_EXPIRED", heading: "Your verification link has expired" },
		{ code: "INVALID_TOKEN", heading: "Invalid verification link" },
	])(
		"explains a $code link and sends a signed-out user a new one that returns here",
		async ({ code, heading }) => {
			searchParamsState.query = `error=${code}`;
			render(<EmailVerifiedClient />);

			expect(screen.getByRole("heading", { name: heading })).toBeVisible();

			await requestNewLink("sarah@stmary.org");

			expect(await screen.findByRole("status")).toHaveTextContent(
				/we sent a new verification link/,
			);
			expect(screen.getByRole("textbox", { name: "Email Address" })).toHaveAccessibleDescription(
				/we sent a new verification link/,
			);
			expect(sendVerificationEmailMock).toHaveBeenCalledWith({
				email: "sarah@stmary.org",
				callbackURL: "/email-verified",
			});
		},
	);

	test("asks the user to wait when resend attempts are rate limited", async () => {
		sendVerificationEmailMock.mockResolvedValue({
			data: null,
			error: { status: 429, message: "Too many requests. Please try again later." },
		});
		render(<EmailVerifiedClient />);

		await requestNewLink("sarah@stmary.org");

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Too many attempts. Wait a moment and try again.",
		);
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Resend verification email" })).toBeEnabled();
	});

	test.each([
		{ scenario: "a verified user", query: "", name: "Continue", href: "/hospital-details" },
		{ scenario: "a signed-out user", query: "error=no_session", name: "Sign in", href: "/sign-in" },
		{
			scenario: "an unverified user",
			query: "error=unverified",
			name: "Sign in",
			href: "/sign-in",
		},
	])(
		"gives $scenario a single $name link instead of a link nested in a button",
		({ query, name, href }) => {
			searchParamsState.query = query;
			render(<EmailVerifiedClient />);

			expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
			expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
		},
	);
});
