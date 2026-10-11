import { cleanup, render, screen } from "@testing-library/react";
import { renderToReadableStream } from "react-dom/server.browser";
import { beforeEach, describe, expect, test, vi } from "vitest";
import NewTransferRequest from "./page";

const { verifySessionMock, getOrganizationContextMock, getPatientsMock, redirectMock } = vi.hoisted(
	() => ({
		verifySessionMock: vi.fn(),
		getOrganizationContextMock: vi.fn(),
		getPatientsMock: vi.fn(),
		redirectMock: vi.fn((path: string) => {
			throw new Error(`REDIRECT:${path}`);
		}),
	}),
);

vi.mock("@/lib/api/verify-session", () => ({ verifySession: verifySessionMock }));
vi.mock("@/lib/api/get-organization-id", () => ({
	getOrganizationContext: getOrganizationContextMock,
}));
vi.mock("@/lib/api/get-patients", () => ({ getPatients: getPatientsMock }));
vi.mock("@/lib/better-auth/auth", () => ({ db: {}, auth: {} }));
vi.mock("next/navigation", () => ({
	redirect: redirectMock,
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

async function renderTransferRequestPage() {
	const stream = await renderToReadableStream(
		<NewTransferRequest searchParams={Promise.resolve({})} />,
		{ onError: () => {} },
	);
	await stream.allReady;
	render(<div dangerouslySetInnerHTML={{ __html: await new Response(stream).text() }} />);
}

describe("new transfer request access", () => {
	beforeEach(() => {
		verifySessionMock.mockResolvedValue({ user: { id: "user-1", emailVerified: true } });
		getOrganizationContextMock.mockResolvedValue({
			organizationId: "hospital-1",
			isOrganizationVerified: true,
			role: "member",
		});
		getPatientsMock.mockResolvedValue({ patients: [], totalPatients: 0 });
	});

	test.each(["owner", "admin", "member"])(
		"lets a verified %s open the transfer form",
		async (role) => {
			getOrganizationContextMock.mockResolvedValue({
				organizationId: "hospital-1",
				isOrganizationVerified: true,
				role,
			});
			await renderTransferRequestPage();

			expect(screen.getByRole("heading", { name: "New Transfer Request" })).toBeVisible();
			expect(redirectMock).not.toHaveBeenCalled();
		},
	);

	test.each([
		{ state: "unverified email", destination: "/email-verified?error=unverified" },
		{ state: "missing hospital membership", destination: "/sign-in" },
		{ state: "hospital awaiting approval", destination: "/verify" },
		{ state: "signed out", destination: "/sign-in" },
	])(
		"routes $state to $destination before showing the transfer form",
		async ({ state, destination }) => {
			await renderTransferRequestPage();
			expect(screen.getByRole("heading", { name: "New Transfer Request" })).toBeVisible();
			cleanup();
			getPatientsMock.mockClear();

			if (state === "unverified email") {
				verifySessionMock.mockResolvedValue({ user: { id: "user-1", emailVerified: false } });
			} else if (state === "missing hospital membership") {
				getOrganizationContextMock.mockResolvedValue(null);
			} else if (state === "hospital awaiting approval") {
				getOrganizationContextMock.mockResolvedValue({
					organizationId: "hospital-1",
					isOrganizationVerified: false,
					role: "member",
				});
			} else {
				verifySessionMock.mockImplementation(() => redirectMock("/sign-in"));
			}

			await renderTransferRequestPage();

			expect(redirectMock).toHaveBeenCalledWith(destination);
			expect(
				screen.queryByRole("heading", { name: "New Transfer Request" }),
			).not.toBeInTheDocument();
			expect(getPatientsMock).not.toHaveBeenCalled();
		},
	);
});
