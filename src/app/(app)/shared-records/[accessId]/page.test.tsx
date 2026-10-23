import { cleanup, render, screen } from "@testing-library/react";
import { prerender } from "react-dom/static.browser";
import { beforeEach, expect, test, vi } from "vitest";
import SharedRecordsPage from "./page";

const loaders = vi.hoisted(() => ({
	getSharedRecord: vi.fn(),
	getSharedPatientDetails: vi.fn(),
	getSharedDiagnoses: vi.fn(),
	getSharedAllergies: vi.fn(),
	getSharedImmunizations: vi.fn(),
	getSharedProcedures: vi.fn(),
	getSharedMedications: vi.fn(),
	getSharedLabTests: vi.fn(),
	getSharedImaging: vi.fn(),
}));

vi.mock("@/lib/api/external-access-session", () => ({
	hasVerifiedExternalAccessSession: vi.fn(async () => true),
}));
vi.mock("@/lib/api/get-shared-record", () => ({ getSharedRecord: loaders.getSharedRecord }));
vi.mock("@/lib/api/get-shared-patient-details", () => ({
	getSharedPatientDetails: loaders.getSharedPatientDetails,
}));
vi.mock("@/lib/api/get-shared-diagnoses", () => ({
	getSharedDiagnoses: loaders.getSharedDiagnoses,
}));
vi.mock("@/lib/api/get-shared-allergies", () => ({
	getSharedAllergies: loaders.getSharedAllergies,
}));
vi.mock("@/lib/api/get-shared-immunizations", () => ({
	getSharedImmunizations: loaders.getSharedImmunizations,
}));
vi.mock("@/lib/api/get-shared-procedures", () => ({
	getSharedProcedures: loaders.getSharedProcedures,
}));
vi.mock("@/lib/api/get-shared-medications", () => ({
	getSharedMedications: loaders.getSharedMedications,
}));
vi.mock("@/lib/api/get-shared-lab-tests", () => ({
	getSharedLabTests: loaders.getSharedLabTests,
}));
vi.mock("@/lib/api/get-shared-imaging", () => ({ getSharedImaging: loaders.getSharedImaging }));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
	useSearchParams: () => new URLSearchParams(),
	usePathname: () => "/shared-records/access-1",
	notFound: vi.fn(),
	redirect: vi.fn(),
}));

function sharedRecordWith(sections: string[]) {
	return {
		patientId: "patient-1",
		sourceOrganizationName: "Source Hospital",
		expiresAt: "2026-10-30T09:00:00.000Z",
		patient: { name: "Ada Obi", sex: "Female", age: "34" },
		selectedRecordIds: sections.map((section, index) => ({ section, recordId: `REC-${index}` })),
	};
}

const amoxicillin = {
	medication: "Amoxicillin",
	dose: "500 mg",
	frequency: "Three times daily",
	duration: "7 days",
	route: "Oral",
	indication: "Infection",
	medicationId: "MED-1",
	createdAt: "1st Oct 2026",
	createdAtValue: "2026-10-01T09:00:00.000Z",
	status: "Discontinued",
};

async function renderSharedRecordsPage(searchParams: Record<string, string> = {}) {
	const { prelude } = await prerender(
		<SharedRecordsPage
			params={Promise.resolve({ accessId: "access-1" })}
			searchParams={Promise.resolve(searchParams)}
		/>,
		{ onError: () => {}, progressiveChunkSize: Infinity },
	);
	const html = await new Response(prelude).text();
	render(<div dangerouslySetInnerHTML={{ __html: html }} />);
}

beforeEach(() => {
	cleanup();
	for (const loader of Object.values(loaders)) {
		loader.mockReset();
		loader.mockResolvedValue({ rows: [], totalRows: 0 });
	}
	loaders.getSharedPatientDetails.mockResolvedValue([]);
});

test("shows a tab for each shared section only, in record order", async () => {
	loaders.getSharedRecord.mockResolvedValue(
		sharedRecordWith(["medications", "immunizations", "patient-details", "medications"]),
	);
	await renderSharedRecordsPage();

	expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
		"Patient Details",
		"Immunization",
		"Medications",
	]);
});

test("opens the section named in the URL and loads only that section's records", async () => {
	loaders.getSharedRecord.mockResolvedValue(
		sharedRecordWith(["patient-details", "diagnoses", "medications"]),
	);
	loaders.getSharedMedications.mockResolvedValue({ rows: [amoxicillin], totalRows: 1 });
	await renderSharedRecordsPage({ section: "medications" });

	expect(screen.getByRole("tab", { name: "Medications" })).toHaveAttribute("aria-selected", "true");
	expect(screen.getByText("Amoxicillin")).toBeInTheDocument();
	expect(loaders.getSharedDiagnoses).not.toHaveBeenCalled();
	expect(loaders.getSharedPatientDetails).not.toHaveBeenCalled();
});

test("opens the first shared section when the URL names one that wasn't shared", async () => {
	loaders.getSharedRecord.mockResolvedValue(sharedRecordWith(["medications", "lab-tests"]));
	loaders.getSharedMedications.mockResolvedValue({ rows: [amoxicillin], totalRows: 1 });
	await renderSharedRecordsPage({ section: "diagnoses" });

	expect(screen.getByRole("tab", { name: "Medications" })).toHaveAttribute("aria-selected", "true");
	expect(screen.getByText("Amoxicillin")).toBeInTheDocument();
	expect(loaders.getSharedDiagnoses).not.toHaveBeenCalled();
});

test("loads the open section with the page, search and filters from the URL", async () => {
	loaders.getSharedRecord.mockResolvedValue(sharedRecordWith(["medications"]));
	loaders.getSharedMedications.mockResolvedValue({ rows: [amoxicillin], totalRows: 30 });
	await renderSharedRecordsPage({
		section: "medications",
		medicationsPage: "2",
		medicationsQuery: "amox",
		medicationsStatus: "Discontinued,Unknown",
		medicationsCreatedFrom: "2026-10-01",
	});

	expect(loaders.getSharedMedications).toHaveBeenCalledWith("access-1", {
		page: 2,
		limit: 14,
		query: "amox",
		statusFilters: ["Discontinued"],
		createdFrom: "2026-10-01",
		createdTo: "",
	});
	expect(screen.getByRole("searchbox")).toHaveValue("amox");
	expect(screen.getByText("Status: Discontinued")).toBeInTheDocument();
	expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
});
