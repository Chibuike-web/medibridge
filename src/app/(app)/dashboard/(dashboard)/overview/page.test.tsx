import { cleanup, render, screen } from "@testing-library/react";
import { renderToReadableStream } from "react-dom/server.browser";
import { beforeEach, expect, test, vi } from "vitest";
import type { RecentPatientType } from "@/features/patients/types";
import type { TransferType } from "@/features/transfers/types";
import Overview from "./page";

const { getRecentPatientsMock, getRecentTransferMock } = vi.hoisted(() => ({
	getRecentPatientsMock: vi.fn(),
	getRecentTransferMock: vi.fn(),
}));

vi.mock("@/lib/api/verify-session", () => ({
	verifySession: async () => ({ user: { id: "user-1", emailVerified: true } }),
}));
vi.mock("@/lib/api/get-organization-id", () => ({
	getOrganizationContext: async () => ({
		organizationId: "hospital-1",
		isOrganizationVerified: true,
		role: "member",
	}),
}));
vi.mock("@/lib/api/get-overview-stats", () => ({
	getOverviewStats: async () => ({
		totalPatients: 1,
		completedTransfers: 0,
		pendingTransfers: 0,
		patientCreatedAt: [],
		patientTransferredAt: [],
		pendingTransferredAt: [],
		encounterCreatedAt: [],
		hasPatients: true,
	}),
}));
vi.mock("@/lib/api/get-recent-patients", () => ({ getRecentPatients: getRecentPatientsMock }));
vi.mock("@/lib/api/get-recent-transfers", () => ({ getRecentTransfer: getRecentTransferMock }));
vi.mock("@/lib/better-auth/auth", () => ({ db: {}, auth: {} }));
vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const recentPatient: RecentPatientType = {
	name: "Adaeze Okafor",
	patientId: "QA-1000",
	gender: "Female",
	age: 35,
	createdAt: "2026-10-13",
};

const recentTransfer: TransferType = {
	id: "transfer-1",
	patientName: "Tunde Bello",
	patientFirstName: "Tunde",
	patientMiddleName: null,
	patientLastName: "Bello",
	patientId: "QA-1001",
	status: "pending",
	requestedAt: "2026-10-13",
	targetHospitalName: "St. Mary's General Hospital",
	targetHospitalEmail: "records@stmary.org",
};

async function renderOverview() {
	cleanup();
	const stream = await renderToReadableStream(<Overview />, { onError: () => {} });
	await stream.allReady;
	render(<div dangerouslySetInnerHTML={{ __html: await new Response(stream).text() }} />);
}

beforeEach(() => {
	getRecentPatientsMock.mockResolvedValue([recentPatient]);
	getRecentTransferMock.mockResolvedValue([recentTransfer]);
});

test("shows recent patients and recent transfers when the hospital has both", async () => {
	await renderOverview();

	expect(screen.getByRole("heading", { name: "Recent Patients" })).toBeVisible();
	expect(screen.getByText("Adaeze Okafor")).toBeVisible();
	expect(screen.getByRole("heading", { name: "Recent Transfers" })).toBeVisible();
	expect(screen.getByText("Tunde Bello")).toBeVisible();
});

test.each([
	{
		emptyList: "Recent Patients",
		otherList: "Recent Transfers",
		readRecords: getRecentPatientsMock,
	},
	{
		emptyList: "Recent Transfers",
		otherList: "Recent Patients",
		readRecords: getRecentTransferMock,
	},
])(
	"leaves out $emptyList entirely when it has no records",
	async ({ emptyList, otherList, readRecords }) => {
		readRecords.mockResolvedValue([]);

		await renderOverview();

		expect(screen.getByRole("heading", { name: otherList })).toBeVisible();
		expect(screen.queryByRole("heading", { name: emptyList })).not.toBeInTheDocument();
		expect(screen.getAllByRole("table")).toHaveLength(1);
	},
);
