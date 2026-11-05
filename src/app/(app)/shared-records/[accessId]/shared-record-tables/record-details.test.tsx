import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TableUrlNavigation } from "@/features/patients/components/table-url-navigation";
import type {
	AllergyDetailsType,
	DiagnosisDetailsType,
	ImagingType,
	ImmunizationDetailsType,
	LabTestType,
	MedicationDetailsType,
	ProcedureDetailsType,
} from "@/features/patients/types";
import { SharedAllergiesTable } from "./allergies-table";
import { SharedDiagnosesTable } from "./diagnoses-table";
import { SharedImagingTable } from "./imaging-table";
import { SharedImmunizationsTable } from "./immunizations-table";
import { SharedLabTestsTable } from "./lab-tests-table";
import { SharedMedicationsTable } from "./medications-table";
import { SharedProceduresTable } from "./procedures-table";

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
	useRouter: () => navigation,
	usePathname: () => "/shared-records/access-1",
	useSearchParams: () => new URLSearchParams(),
}));

const createdAt = { createdAt: "1st Oct 2026", createdAtValue: "2026-10-01T09:00:00.000Z" };
const tableProps = {
	accessId: "access-1",
	page: 1,
	limit: 14,
	totalPages: 1,
	searchQuery: "",
	sort: "",
	order: "",
	statusFilters: [],
	createdFrom: "",
	createdTo: "",
};
const allergy: AllergyDetailsType = {
	allergyId: "ALG-1",
	encounterId: null,
	allergen: "Penicillin",
	reaction: "Hives across the chest",
	severity: "Severe",
	status: "Active",
	createdAt: "1 October 2026 at 09:00",
	updatedAt: "1st October 2026",
	createdBy: "Dr. Ade",
	updatedBy: "Dr. Ade",
	clinicalNote: "-",
	editValues: {
		updatedAt: "2026-10-01T09:00:00.000Z",
		reaction: "Hives across the chest",
		clinicalNote: "",
	},
	history: [],
};
const diagnosis: DiagnosisDetailsType = {
	diagnosisId: "DIA-1",
	encounterId: null,
	name: "Asthma",
	status: "Active",
	severityStage: "Moderate persistent",
	diagnosedAt: "1st October 2026",
	createdAt: "1 October 2026 at 09:00",
	updatedAt: "1st October 2026",
	lastReviewedAt: "-",
	diagnosedBy: "Dr. Ade",
	createdBy: "Dr. Ade",
	updatedBy: "Dr. Ade",
	clinicalNote: "-",
	editValues: {
		updatedAt: "2026-10-01T09:00:00.000Z",
		severityStage: "Moderate persistent",
		diagnosedAt: "2026-10-01",
		diagnosedBy: "Dr. Ade",
		clinicalNote: "",
	},
	history: [],
	relatedRecords: { medications: [], labTests: [], imaging: [], procedures: [] },
};
const immunization: ImmunizationDetailsType = {
	immunizationId: "IMM-1",
	encounterId: null,
	vaccineName: "Hepatitis B",
	seriesType: "Primary series",
	currentDose: "1",
	totalDoses: "3",
	status: "Completed",
	dateAdministered: "1st October 2026",
	administeredBy: "Nurse Bola",
	createdAt: "1 October 2026 at 09:00",
	updatedAt: "1st October 2026",
	createdBy: "Nurse Bola",
	updatedBy: "Nurse Bola",
	clinicalNote: "-",
	editValues: {
		updatedAt: "2026-10-01T09:00:00.000Z",
		seriesType: "Primary series",
		currentDose: "1",
		totalDoses: "3",
		dateAdministered: "2026-10-01",
		administeredBy: "Nurse Bola",
		clinicalNote: "",
	},
	history: [],
};
const medication: MedicationDetailsType = {
	medicationId: "MED-1",
	encounterId: null,
	name: "Amoxicillin",
	dose: "500 mg",
	route: "Oral",
	indication: "Chest infection",
	status: "Active",
	frequency: "Three times daily",
	duration: "7 days",
	prescribedBy: "Dr. Ade",
	startedAt: "1st October 2026",
	createdAt: "1 October 2026 at 09:00",
	updatedAt: "1st October 2026",
	createdBy: "Dr. Ade",
	clinicalNote: "-",
	editValues: {
		updatedAt: "2026-10-01T09:00:00.000Z",
		indication: "Chest infection",
		dose: "500 mg",
		route: "Oral",
		prescribedBy: "Dr. Ade",
		frequency: "Three times daily",
		duration: "7 days",
		startedAt: "2026-10-01",
		clinicalNote: "",
	},
	history: [],
};
const procedure: ProcedureDetailsType = {
	procedureId: "PRO-1",
	encounterId: null,
	name: "Appendectomy",
	indication: "Acute appendicitis",
	status: "Completed",
	procedureDate: "1st October 2026",
	performedBy: "Dr. Ade",
	assistants: [],
	facility: "Theatre 1",
	plannedDate: "-",
	plannedPhysician: "-",
	plannedAssistants: [],
	plannedFacility: "-",
	clinicalNote: "-",
	createdAt: "1 October 2026 at 09:00",
	updatedAt: "1st October 2026",
	createdBy: "Dr. Ade",
	updatedBy: "Dr. Ade",
	relatedRecords: { diagnosis: null, medication: null },
	editValues: {
		updatedAt: "2026-10-01T09:00:00.000Z",
		indication: "Acute appendicitis",
		procedureDate: "2026-10-01",
		physician: "Dr. Ade",
		assistants: "",
		facility: "Theatre 1",
		clinicalNote: "",
	},
	history: [],
};
const labTest: LabTestType = {
	test: "Full Blood Count - 11.2",
	testName: "Full Blood Count",
	labId: "LAB-1",
	encounterId: null,
	result: "11.2",
	specimen: "Venous blood",
	referenceRange: "4.0 - 11.0",
	interpretation: "Raised white cell count",
	flag: "High",
	orderedAtValue: "",
	orderedAtLabel: "-",
	orderedAtSortValue: "",
	orderedBy: "Dr. Ade",
	createdAtLabel: "1 October 2026 at 09:00",
	createdAtSortValue: "",
	updatedAtLabel: "1 October 2026 at 09:00",
	updatedAtSortValue: "",
	updatedAtValue: "2026-10-01T09:00:00.000Z",
	createdBy: "Dr. Ade",
	updatedBy: "Dr. Ade",
	status: "Completed",
	clinicalNote: "",
	files: [
		{
			id: "FILE-1",
			name: "Blood count.pdf",
			url: "/api/shared-record-files/access-1/lab/FILE-1",
			type: "application/pdf",
			size: "120 KB",
			uploadedAtLabel: "1 October 2026 at 09:00",
		},
	],
	history: [],
};
const imaging: ImagingType = {
	study: "Chest X-ray",
	imagingId: "IMG-1",
	encounterId: "",
	modality: "X-ray",
	region: "Chest",
	impression: "No focal consolidation",
	orderedAtLabel: "-",
	orderedAtValue: "",
	orderedAtSortValue: "",
	orderedBy: "Dr. Ade",
	reportedBy: "Dr. Chika",
	status: "Completed",
	clinicalNote: "",
	files: [],
	createdBy: "Dr. Ade",
	updatedBy: "Dr. Ade",
	createdAtLabel: "1st Oct 2026",
	updatedAtLabel: "1st Oct 2026",
	updatedAtValue: "2026-10-01T09:00:00.000Z",
	history: [],
};

const tableCases: {
	name: string;
	table: ReactNode;
	rowMenuLabel: string;
	detailsUrl: string;
	details: Record<string, unknown>;
	drawerTitle: string;
	detailText: string;
}[] = [
	{
		name: "allergies",
		table: (
			<SharedAllergiesTable
				{...tableProps}
				rows={[
					{
						allergen: "Penicillin",
						allergyId: "ALG-1",
						reaction: "Rash",
						severity: "Severe",
						status: "Active",
						...createdAt,
					},
				]}
				severityFilters={[]}
			/>
		),
		rowMenuLabel: "Open allergy actions",
		detailsUrl: "/api/shared-allergy-details/access-1/ALG-1",
		details: { allergy },
		drawerTitle: "Allergy details",
		detailText: "Hives across the chest",
	},
	{
		name: "diagnoses",
		table: (
			<SharedDiagnosesTable
				{...tableProps}
				rows={[
					{
						name: "Asthma",
						diagnosedAt: "1st Oct 2026",
						diagnosedAtValue: "2026-10-01T00:00:00.000Z",
						lastReviewed: "-",
						lastReviewedValue: "",
						diagnosisId: "DIA-1",
						status: "Active",
						...createdAt,
					},
				]}
				diagnosedFrom=""
				diagnosedTo=""
				reviewedFrom=""
				reviewedTo=""
			/>
		),
		rowMenuLabel: "Open diagnosis actions",
		detailsUrl: "/api/shared-diagnosis-details/access-1/DIA-1",
		details: { diagnosis },
		drawerTitle: "Diagnosis details",
		detailText: "Moderate persistent",
	},
	{
		name: "immunizations",
		table: (
			<SharedImmunizationsTable
				{...tableProps}
				rows={[
					{
						vaccineName: "Hepatitis B",
						dose: "1",
						immunizationId: "IMM-1",
						status: "Completed",
						...createdAt,
					},
				]}
			/>
		),
		rowMenuLabel: "Open immunization actions",
		detailsUrl: "/api/shared-immunization-details/access-1/IMM-1",
		details: { immunization },
		drawerTitle: "Immunization details",
		detailText: "Nurse Bola",
	},
	{
		name: "medications",
		table: (
			<SharedMedicationsTable
				{...tableProps}
				rows={[
					{
						medication: "Amoxicillin",
						dose: "500 mg",
						frequency: "Three times daily",
						duration: "7 days",
						route: "Oral",
						indication: "Infection",
						medicationId: "MED-1",
						status: "Active",
						...createdAt,
					},
				]}
			/>
		),
		rowMenuLabel: "Open medication actions",
		detailsUrl: "/api/shared-medication-details/access-1/MED-1",
		details: { medication },
		drawerTitle: "Medication details",
		detailText: "Chest infection",
	},
	{
		name: "procedures",
		table: (
			<SharedProceduresTable
				{...tableProps}
				rows={[
					{
						procedure: "Appendectomy",
						indication: "Appendicitis",
						facility: "Theatre 1",
						procedureId: "PRO-1",
						status: "Completed",
						...createdAt,
					},
				]}
			/>
		),
		rowMenuLabel: "Open procedure actions",
		detailsUrl: "/api/shared-procedure-details/access-1/PRO-1",
		details: { procedure },
		drawerTitle: "Procedure details",
		detailText: "Acute appendicitis",
	},
	{
		name: "lab tests",
		table: (
			<SharedLabTestsTable
				{...tableProps}
				rows={[
					{
						test: "Full Blood Count",
						result: "11.2",
						labId: "LAB-1",
						referenceRange: "4.0 - 11.0",
						interpretation: "High",
						status: "Completed",
						...createdAt,
					},
				]}
				interpretationFilters={[]}
			/>
		),
		rowMenuLabel: "Open lab test actions",
		detailsUrl: "/api/shared-lab-test-details/access-1/LAB-1",
		details: { labTest },
		drawerTitle: "Lab test details",
		detailText: "Raised white cell count",
	},
	{
		name: "imaging",
		table: (
			<SharedImagingTable
				{...tableProps}
				rows={[
					{
						study: "Chest X-ray",
						modality: "X-ray",
						region: "Chest",
						impression: "Clear",
						orderedAt: "1st Oct 2026",
						orderedAtValue: "2026-10-01T09:00:00.000Z",
						imagingId: "IMG-1",
						status: "Completed",
						...createdAt,
					},
				]}
				modalityFilters={[]}
				orderedFrom=""
				orderedTo=""
			/>
		),
		rowMenuLabel: "Open imaging actions",
		detailsUrl: "/api/shared-imaging-details/access-1/IMG-1",
		details: { imaging },
		drawerTitle: "Imaging details",
		detailText: "No focal consolidation",
	},
];

const fetchDetails = vi.fn();

function renderTable(table: ReactNode) {
	return render(
		<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
			<TableUrlNavigation>{table}</TableUrlNavigation>
		</SWRConfig>,
	);
}

beforeEach(() => {
	vi.stubGlobal("fetch", fetchDetails);
});
afterEach(() => {
	vi.unstubAllGlobals();
});

describe.each(tableCases)(
	"shared $name details",
	({ table, rowMenuLabel, detailsUrl, details, drawerTitle, detailText }) => {
		test("View details opens the row's record from the shared link, read-only", async () => {
			const user = userEvent.setup();
			fetchDetails.mockImplementation(async () => Response.json(details));
			renderTable(table);
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

			await user.click(screen.getByRole("button", { name: rowMenuLabel }));
			await user.click(screen.getByRole("menuitem", { name: "View details" }));

			const drawer = await screen.findByRole("dialog", { name: drawerTitle });
			expect(await within(drawer).findByText(detailText)).toBeVisible();
			expect(fetchDetails).toHaveBeenCalledWith(detailsUrl);
			expect(within(drawer).getByRole("button", { name: /^Close/ })).toBeVisible();
			expect(within(drawer).queryByRole("button", { name: /actions/i })).not.toBeInTheDocument();
			expect(
				within(drawer).queryByRole("button", { name: /^(Edit|Archive|Delete|Save changes)/ }),
			).not.toBeInTheDocument();
			expect(within(drawer).queryByRole("textbox")).not.toBeInTheDocument();
			expect(within(drawer).queryByRole("combobox")).not.toBeInTheDocument();
		});

		test("a record the link can no longer read shows that it could not be found", async () => {
			const user = userEvent.setup();
			fetchDetails.mockImplementation(async () =>
				Response.json(Object.fromEntries(Object.keys(details).map((key) => [key, null])), {
					status: 404,
				}),
			);
			renderTable(table);

			await user.click(screen.getByRole("button", { name: rowMenuLabel }));
			await user.click(screen.getByRole("menuitem", { name: "View details" }));

			const drawer = await screen.findByRole("dialog", { name: drawerTitle });
			expect(await within(drawer).findByText(/details could not be found\.$/)).toBeVisible();
			expect(within(drawer).queryByText(detailText)).not.toBeInTheDocument();
		});
	},
);

test("an expired verification sends the viewer back through the link check", async () => {
	const user = userEvent.setup();
	fetchDetails.mockImplementation(async () =>
		Response.json(
			{ status: "failed", error: "Verify your access to view this shared record." },
			{ status: 401 },
		),
	);
	renderTable(tableCases[0].table);

	await user.click(screen.getByRole("button", { name: "Open allergy actions" }));
	await user.click(screen.getByRole("menuitem", { name: "View details" }));

	await vi.waitFor(() => expect(navigation.refresh).toHaveBeenCalled());
});

test("shared lab test files open through the shared link", async () => {
	const user = userEvent.setup();
	fetchDetails.mockImplementation(async () => Response.json({ labTest }));
	renderTable(tableCases[5].table);

	await user.click(screen.getByRole("button", { name: "Open lab test actions" }));
	await user.click(screen.getByRole("menuitem", { name: "View details" }));

	const drawer = await screen.findByRole("dialog", { name: "Lab test details" });
	expect(await within(drawer).findByRole("link", { name: "Open" })).toHaveAttribute(
		"href",
		"/api/shared-record-files/access-1/lab/FILE-1",
	);
});
