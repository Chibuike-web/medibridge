import { cleanup, render, screen } from "@testing-library/react";
import { renderToReadableStream } from "react-dom/server.browser";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Overview from "./overview/page";
import PatientsPage from "./patients/page";
import TransfersPage from "./transfers/page";
import AddNewPatient from "../add-new-patient/page";

const {
	verifySessionMock,
	getOrganizationContextMock,
	getPatientsMock,
	getTransfersMock,
	getOverviewStatsMock,
	redirectMock,
} = vi.hoisted(() => ({
	verifySessionMock: vi.fn(),
	getOrganizationContextMock: vi.fn(),
	getPatientsMock: vi.fn(),
	getTransfersMock: vi.fn(),
	getOverviewStatsMock: vi.fn(),
	redirectMock: vi.fn((path: string) => {
		throw new Error(`REDIRECT:${path}`);
	}),
}));

vi.mock("@/lib/api/verify-session", () => ({ verifySession: verifySessionMock }));
vi.mock("@/lib/api/get-organization-id", () => ({
	getOrganizationContext: getOrganizationContextMock,
}));
vi.mock("@/lib/api/get-patients", () => ({ getPatients: getPatientsMock }));
vi.mock("@/lib/api/get-transfers", () => ({ getTransfers: getTransfersMock }));
vi.mock("@/lib/api/get-overview-stats", () => ({ getOverviewStats: getOverviewStatsMock }));
vi.mock("@/lib/better-auth/auth", () => ({ db: {}, auth: {} }));
vi.mock("next/navigation", () => ({
	redirect: redirectMock,
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

describe.each([
	{
		name: "overview",
		page: () => <Overview />,
		heading: "No patient records available",
		readRecords: getOverviewStatsMock,
		addPatientReturnTo: "/dashboard/overview",
	},
	{
		name: "patients",
		page: () => <PatientsPage searchParams={Promise.resolve({})} />,
		heading: "No patient records available",
		readRecords: getPatientsMock,
		addPatientReturnTo: "/dashboard/patients",
	},
	{
		name: "transfers",
		page: () => <TransfersPage searchParams={Promise.resolve({})} />,
		heading: "No transfers yet",
		readRecords: getTransfersMock,
		addPatientReturnTo: null,
	},
])("$name page access", ({ page, heading, readRecords, addPatientReturnTo }) => {
	beforeEach(() => {
		verifySessionMock.mockResolvedValue({ user: { id: "user-1", emailVerified: true } });
		getOrganizationContextMock.mockResolvedValue({
			organizationId: "hospital-1",
			isOrganizationVerified: true,
			role: "member",
		});
		getPatientsMock.mockResolvedValue({ hasPatients: false, patients: [], totalPatients: 0 });
		getTransfersMock.mockResolvedValue({ hasTransfers: false, transfers: [], totalTransfers: 0 });
		getOverviewStatsMock.mockResolvedValue({ hasPatients: false });
	});

	async function renderPage(pageElement = page()) {
		const stream = await renderToReadableStream(pageElement, { onError: () => {} });
		await stream.allReady;
		render(<div dangerouslySetInnerHTML={{ __html: await new Response(stream).text() }} />);
	}

	test("shows the page for a member with verified email and hospital", async () => {
		await renderPage();
		expect(screen.getByRole("heading", { name: heading })).toBeVisible();
		expect(redirectMock).not.toHaveBeenCalled();
	});

	if (addPatientReturnTo) {
		test("returns to the originating page after opening Add Patient", async () => {
			await renderPage();
			expect(screen.getByRole("heading", { name: heading })).toBeVisible();
			const destination = new URL(
				screen.getByRole("link", { name: "Add patient" }).getAttribute("href")!,
				"http://localhost",
			);
			expect(destination.pathname).toBe("/dashboard/add-new-patient");
			expect(destination.searchParams.get("returnTo")).toBe(addPatientReturnTo);
			cleanup();
			await renderPage(
				<AddNewPatient
					searchParams={Promise.resolve({ returnTo: destination.searchParams.get("returnTo")! })}
				/>,
			);
			expect(screen.getByRole("heading", { name: "Upload Patient’s Record" })).toBeVisible();
			expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
				"href",
				addPatientReturnTo,
			);
		});
	}

	test.each([
		{ state: "unverified email", destination: "/email-verified?error=unverified" },
		{ state: "missing hospital membership", destination: "/sign-in" },
		{ state: "hospital awaiting approval", destination: "/verify" },
		{ state: "signed out", destination: "/sign-in" },
	])(
		"redirects $state before showing the page or loading records",
		async ({ state, destination }) => {
			await renderPage();
			expect(screen.getByRole("heading", { name: heading })).toBeVisible();
			cleanup();
			readRecords.mockClear();

			if (state === "unverified email") {
				verifySessionMock.mockResolvedValue({ user: { id: "user-1", emailVerified: false } });
			} else if (state === "missing hospital membership") {
				getOrganizationContextMock.mockResolvedValue(null);
			} else if (state === "hospital awaiting approval") {
				getOrganizationContextMock.mockResolvedValue({
					organizationId: "hospital-1",
					isOrganizationVerified: false,
				});
			} else {
				verifySessionMock.mockImplementation(() => redirectMock("/sign-in"));
			}

			await renderPage();
			expect(redirectMock).toHaveBeenCalledWith(destination);
			expect(screen.queryByRole("heading", { name: heading })).not.toBeInTheDocument();
			expect(readRecords).not.toHaveBeenCalled();
		},
	);
});
