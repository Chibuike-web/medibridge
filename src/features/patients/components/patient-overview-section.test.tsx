import { cleanup, render, screen } from "@testing-library/react";
import { renderToReadableStream } from "react-dom/server.browser";
import { beforeEach, expect, test, vi } from "vitest";
import { PatientOverviewSection } from "./patient-overview-section";

const { getPatientProfileMock } = vi.hoisted(() => ({ getPatientProfileMock: vi.fn() }));

vi.mock("@/lib/api/get-patient-profile", () => ({ getPatientProfile: getPatientProfileMock }));
vi.mock("next/navigation", () => ({ notFound: vi.fn() }));

const diagnosis = {
	name: "Malaria",
	diagnosedAt: "2026-10-01",
	lastReviewed: "2026-10-05",
	id: "DX-1",
	createdAt: "2026-10-01",
	status: "Active",
};

const allergy = {
	allergen: "Penicillin",
	id: "AL-1",
	reaction: "Rash",
	createdAt: "2026-10-01",
	severity: "Moderate",
	status: "Active",
};

const profile = {
	overviewPersonalInformation: [{ label: "Full name", value: "Tunde Bello" }],
	overviewMedicalInformation: [{ label: "Blood group", value: "O+" }],
	recentDiagnoses: [diagnosis],
	recentAllergies: [allergy],
};

async function renderOverview() {
	cleanup();
	const stream = await renderToReadableStream(<PatientOverviewSection patientId="QA-1001" />, {
		onError: () => {},
	});
	await stream.allReady;
	render(<div dangerouslySetInnerHTML={{ __html: await new Response(stream).text() }} />);
}

beforeEach(() => {
	getPatientProfileMock.mockResolvedValue(profile);
});

test("shows recent diagnoses and allergies when the patient has them", async () => {
	await renderOverview();

	expect(screen.getByRole("heading", { name: "Recent Diagnoses" })).toBeVisible();
	expect(screen.getByText("Malaria")).toBeVisible();
	expect(screen.getByRole("heading", { name: "Recent Allergies" })).toBeVisible();
	expect(screen.getByText("Penicillin")).toBeVisible();
});

test.each([
	{
		emptyList: "Recent Diagnoses",
		otherList: "Recent Allergies",
		emptyField: { recentDiagnoses: [] },
	},
	{
		emptyList: "Recent Allergies",
		otherList: "Recent Diagnoses",
		emptyField: { recentAllergies: [] },
	},
])(
	"leaves out $emptyList entirely when the patient has none",
	async ({ emptyList, otherList, emptyField }) => {
		getPatientProfileMock.mockResolvedValue({ ...profile, ...emptyField });

		await renderOverview();

		expect(screen.getByRole("heading", { name: "Patient Overview" })).toBeVisible();
		expect(screen.getByRole("heading", { name: otherList })).toBeVisible();
		expect(screen.queryByRole("heading", { name: emptyList })).not.toBeInTheDocument();
		expect(screen.getAllByRole("table")).toHaveLength(1);
	},
);
