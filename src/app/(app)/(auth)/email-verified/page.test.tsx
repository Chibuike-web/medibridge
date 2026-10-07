import { render, screen } from "@testing-library/react";
import { renderToReadableStream } from "react-dom/server.browser";
import { beforeEach, describe, expect, test, vi } from "vitest";
import EmailVerified from "./page";

const { getSessionDataMock, redirectMock, searchParamsState } = vi.hoisted(() => ({
	getSessionDataMock: vi.fn(),
	redirectMock: vi.fn((path: string) => {
		throw new Error(`REDIRECT:${path}`);
	}),
	searchParamsState: { query: "" },
}));

vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("next/navigation", () => ({
	redirect: redirectMock,
	useSearchParams: () => new URLSearchParams(searchParamsState.query),
}));
vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: { sendVerificationEmail: vi.fn() },
}));

async function renderEmailVerifiedPage(error?: string | string[]) {
	const errorValues = Array.isArray(error) ? error : error === undefined ? [] : [error];
	searchParamsState.query = new URLSearchParams(
		errorValues.map((value) => ["error", value]),
	).toString();
	const stream = await renderToReadableStream(
		<EmailVerified searchParams={Promise.resolve({ error })} />,
		{ onError: () => {} },
	);
	await stream.allReady;
	const html = await new Response(stream).text();
	render(<div dangerouslySetInnerHTML={{ __html: html }} />);
}

describe("email verification result page", () => {
	beforeEach(() => {
		getSessionDataMock.mockResolvedValue({ user: { emailVerified: true } });
	});

	test("shows verified success only to a signed-in account whose email is verified", async () => {
		await renderEmailVerifiedPage();

		expect(screen.getByRole("heading", { name: "Email verified" })).toBeVisible();
		expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute(
			"href",
			"/hospital-details",
		);
		expect(redirectMock).not.toHaveBeenCalled();
	});

	test("routes a signed-out direct visitor to sign-in recovery", async () => {
		getSessionDataMock.mockResolvedValue(null);
		await renderEmailVerifiedPage();

		expect(redirectMock).toHaveBeenCalledWith("/email-verified?error=no_session");
		await renderEmailVerifiedPage("no_session");
		expect(screen.getByRole("heading", { name: "You are not signed in" })).toBeVisible();
		expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
	});

	test("routes an unverified session to verification recovery", async () => {
		getSessionDataMock.mockResolvedValue({ user: { emailVerified: false } });
		await renderEmailVerifiedPage();

		expect(redirectMock).toHaveBeenCalledWith("/email-verified?error=unverified");
		await renderEmailVerifiedPage("unverified");
		expect(screen.getByRole("heading", { name: "Email verification required" })).toBeVisible();
		expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
	});

	test("does not report success for a signed-out visitor using repeated empty error parameters", async () => {
		getSessionDataMock.mockResolvedValue(null);
		await renderEmailVerifiedPage(["", ""]);

		expect(redirectMock).toHaveBeenCalledWith("/email-verified?error=no_session");
	});
});
