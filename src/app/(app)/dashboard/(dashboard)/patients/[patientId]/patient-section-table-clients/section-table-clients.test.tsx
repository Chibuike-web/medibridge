import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SWRConfig } from "swr";
import { AllergiesClient } from "./allergies-client";
import type { AllergyDetailsType, AllergyType } from "@/features/patients/types";
import { DiagnosesClient } from "./diagnoses-client";
import type { DiagnosisType } from "@/features/patients/types";
import { EncountersClient } from "./encounters-client";
import type { EncounterType } from "@/features/patients/types";
import { ImagingClient } from "./imaging-client";
import type { ImagingType } from "@/features/patients/types";
import { ImmunizationsClient } from "./immunizations-client";
import type { ImmunizationType } from "@/features/patients/types";
import { LabTestsClient } from "./lab-tests-client";
import type { LabTestType } from "@/features/patients/types";
import { MedicationsClient } from "./medications-client";
import type { MedicationType } from "@/features/patients/types";
import { ProceduresClient } from "./procedures-client";
import type { ProcedureType } from "@/features/patients/types";
import { VitalsClient } from "./vitals-client";
import type { VitalType } from "@/features/patients/types";
vi.mock("@/features/patients/server/update-patient-physical-information-action", () => ({
	updatePatientPhysicalInformationAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-encounter-action", () => ({
	updatePatientEncounterAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-diagnosis-action", () => ({
	createPatientDiagnosisAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-imaging-action", () => ({
	updatePatientImagingAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-medication-action", () => ({
	createPatientMedicationAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-lab-test-action", () => ({
	updatePatientLabTestAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-encounter-action", () => ({
	createPatientEncounterAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-diagnosis-action", () => ({
	updatePatientDiagnosisAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-procedure-action", () => ({
	createPatientProcedureAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-immunization-action", () => ({
	createPatientImmunizationAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-vital-action", () => ({
	createPatientVitalAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-lab-test-action", () => ({
	createPatientLabTestAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-imaging-action", () => ({
	createPatientImagingAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-immunization-action", () => ({
	updatePatientImmunizationAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-medication-action", () => ({
	updatePatientMedicationAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-emergency-contact-action", () => ({
	updatePatientEmergencyContactAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-allergy-action", () => ({
	updatePatientAllergyAction: updateAllergy,
}));
vi.mock("@/features/patients/server/update-patient-procedure-action", () => ({
	updatePatientProcedureAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-contact-information-action", () => ({
	updatePatientContactInformationAction: vi.fn(),
}));
const { createAllergy, updateAllergy } = vi.hoisted(() => ({
	createAllergy: vi.fn(),
	updateAllergy: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-allergy-action", () => ({
	createPatientAllergyAction: createAllergy,
}));
vi.mock("@/features/patients/server/update-patient-personal-information-action", () => ({
	updatePatientPersonalInformationAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: "owner" } }),
		useSession: () => ({ data: { user: { name: "Dr. Ada" } } }),
	},
}));
afterEach(() => vi.unstubAllGlobals());
const allergies: AllergyType[] = [
	{
		allergen: "Peanuts",
		allergyId: "AL-peanut",
		reaction: "Anaphylaxis",
		createdAtLabel: "Mar 3, 2021",
		createdAtSortValue: "2021-03-03",
		severity: "Severe",
		status: "Active",
	},
	{
		allergen: "Latex",
		allergyId: "AL-latex",
		reaction: "Rash",
		createdAtLabel: "Jan 9, 2020",
		createdAtSortValue: "2020-01-09",
		severity: "Mild",
		status: "Inactive",
	},
];

const diagnoses: DiagnosisType[] = [
	{
		name: "Hypertension",
		diagnosedAtLabel: "Jan 5, 2020",
		diagnosedAtSortValue: "2020-01-05",
		lastReviewedLabel: "Mar 1, 2020",
		lastReviewedSortValue: "2020-03-01",
		diagnosisId: "DX-hyper",
		createdAtLabel: "Jan 6, 2020",
		createdAtSortValue: "2020-01-06",
		status: "Active",
	},
	{
		name: "Asthma",
		diagnosedAtLabel: "Feb 10, 2019",
		diagnosedAtSortValue: "2019-02-10",
		lastReviewedLabel: "Feb 1, 2020",
		lastReviewedSortValue: "2020-02-01",
		diagnosisId: "DX-asthma",
		createdAtLabel: "Feb 11, 2019",
		createdAtSortValue: "2019-02-11",
		status: "Resolved",
	},
];

const encounters: EncounterType[] = [
	{
		encounterId: "ENC-2001",
		patientId: "patient-a",
		encounterDateLabel: "Mar 5, 2024",
		encounterDateSortValue: "2024-03-05",
		createdAtLabel: "Mar 5, 2024",
		createdAtSortValue: "2024-03-05",
		updatedAtLabel: "Mar 6, 2024",
		updatedAtSortValue: "2024-03-06",
		createdBy: "Dr. Okafor",
		updatedBy: "Dr. Okafor",
		encounterType: "Routine Checkup",
		department: "General Medicine",
		physician: "Dr. Amaka Okafor",
	},
	{
		encounterId: "ENC-1001",
		patientId: "patient-a",
		encounterDateLabel: "Jan 12, 2024",
		encounterDateSortValue: "2024-01-12",
		createdAtLabel: "Jan 12, 2024",
		createdAtSortValue: "2024-01-12",
		updatedAtLabel: "Jan 12, 2024",
		updatedAtSortValue: "2024-01-12",
		createdBy: "Dr. Bello",
		updatedBy: "Dr. Bello",
		encounterType: "Emergency Visit",
		department: "Emergency Medicine",
		physician: "Dr. Zainab Bello",
	},
];

const imagingStudies: ImagingType[] = [
	{
		study: "Chest X-ray",
		imagingId: "IMG-CXR",
		encounterId: "ENC-1",
		modality: "X-ray",
		region: "Chest",
		impression: "No acute cardiopulmonary findings.",
		orderedAtLabel: "Jan 5, 2020",
		orderedAtValue: "2020-01-05",
		orderedAtSortValue: "2020-01-05T00:00:00.000Z",
		orderedBy: "Dr. Okafor",
		reportedBy: "Dr. Musa",
		status: "Completed",
		clinicalNote: "Follow-up in six weeks.",
		files: [
			{
				id: "FILE-cxr",
				name: "chest-xray.png",
				url: "/api/patient-record-files/FILE-cxr",
				type: "image/png",
				size: "2.4 MB",
				uploadedAtLabel: "Jan 6, 2020",
			},
		],
		createdBy: "Nurse Ada",
		updatedBy: "Nurse Ada",
		createdAtLabel: "Jan 6, 2020",
		updatedAtLabel: "Jan 7, 2020",
		updatedAtValue: "2026-01-02T09:00:00.000Z",
		history: [],
	},
	{
		study: "Abdominal Ultrasound",
		imagingId: "IMG-USA",
		encounterId: "ENC-2",
		modality: "Ultrasound",
		region: "Abdomen",
		impression: "",
		orderedAtLabel: "Jan 1, 2020",
		orderedAtValue: "2020-01-01",
		orderedAtSortValue: "2020-01-01T00:00:00.000Z",
		orderedBy: "Dr. Bello",
		reportedBy: "",
		status: "Pending",
		clinicalNote: "",
		files: [],
		createdBy: "Nurse Ada",
		updatedBy: "Nurse Ada",
		createdAtLabel: "Jan 2, 2020",
		updatedAtLabel: "Jan 2, 2020",
		updatedAtValue: "2026-01-02T09:00:00.000Z",
		history: [],
	},
];

const immunizations: ImmunizationType[] = [
	{
		vaccineName: "Tetanus toxoid",
		immunizationId: "IMM-3001",
		dose: "Dose 2 of 3",
		createdAtLabel: "Mar 5, 2024",
		createdAtSortValue: "2024-03-05",
		status: "Active",
	},
	{
		vaccineName: "Hepatitis B",
		immunizationId: "IMM-1001",
		dose: "Dose 3 of 3",
		createdAtLabel: "Jan 12, 2024",
		createdAtSortValue: "2024-01-12",
		status: "Completed",
	},
];

const labTests: LabTestType[] = [
	{
		test: "Hemoglobin A1c",
		testName: "Hemoglobin A1c",
		labId: "LAB-A1C",
		encounterId: "ENC-1",
		result: "6.1 %",
		specimen: "Whole blood",
		referenceRange: "4.0 - 5.6 %",
		interpretation: "Above the expected range",
		flag: "High",
		orderedAtValue: "2020-01-05",
		orderedAtLabel: "Jan 5, 2020",
		orderedAtSortValue: "2020-01-05T00:00:00.000Z",
		orderedBy: "Dr. Okafor",
		createdAtLabel: "Jan 6, 2020",
		createdAtSortValue: "2020-01-06T09:00:00.000Z",
		updatedAtLabel: "Jan 7, 2020",
		updatedAtValue: "2026-01-02T09:00:00.000Z",
		updatedAtSortValue: "2020-01-07T09:00:00.000Z",
		createdBy: "Nurse Ada",
		updatedBy: "Nurse Ada",
		status: "Completed",
		clinicalNote: "Repeat in three months.",
		files: [
			{
				id: "FILE-a1c",
				name: "a1c-report.pdf",
				url: "/api/patient-record-files/FILE-a1c",
				type: "application/pdf",
				size: "120 KB",
				uploadedAtLabel: "Jan 6, 2020",
			},
		],
		history: [],
	},
	{
		test: "Basic Metabolic Panel",
		testName: "Basic Metabolic Panel",
		labId: "LAB-BMP",
		encounterId: "ENC-2",
		result: "-",
		specimen: "Serum",
		referenceRange: "-",
		interpretation: "Awaiting result",
		flag: "",
		orderedAtValue: "2020-01-01",
		orderedAtLabel: "Jan 1, 2020",
		orderedAtSortValue: "2020-01-01T00:00:00.000Z",
		orderedBy: "Dr. Bello",
		createdAtLabel: "Jan 2, 2020",
		createdAtSortValue: "2020-01-02T09:00:00.000Z",
		updatedAtLabel: "Jan 2, 2020",
		updatedAtValue: "2026-01-02T09:00:00.000Z",
		updatedAtSortValue: "2020-01-02T09:00:00.000Z",
		createdBy: "Nurse Ada",
		updatedBy: "Nurse Ada",
		status: "Pending",
		clinicalNote: "",
		files: [],
		history: [],
	},
];

const medications: MedicationType[] = [
	{
		medication: "Metformin",
		dose: "500 mg",
		route: "Oral",
		medicationId: "MED-metformin",
		indication: "Type 2 diabetes",
		createdAtLabel: "Apr 2, 2021",
		createdAtSortValue: "2021-04-02",
		status: "Active",
	},
	{
		medication: "Amoxicillin",
		dose: "250 mg",
		route: "Intravenous",
		medicationId: "MED-amox",
		indication: "Ear infection",
		createdAtLabel: "Feb 14, 2020",
		createdAtSortValue: "2020-02-14",
		status: "Completed",
	},
];

const procedures: ProcedureType[] = [
	{
		procedure: "Knee arthroscopy",
		procedureId: "PROC-3001",
		createdAtLabel: "Mar 5, 2024",
		createdAtSortValue: "2024-03-05",
		indication: "Persistent right knee pain",
		facility: "Orthopaedic Day Surgery",
		status: "Pending",
	},
	{
		procedure: "Appendectomy",
		procedureId: "PROC-1001",
		createdAtLabel: "Jan 12, 2024",
		createdAtSortValue: "2024-01-12",
		indication: "Acute appendicitis",
		facility: "Main Theatre Block",
		status: "Completed",
	},
];

const vitals: VitalType[] = [
	{
		vitalId: "V-newer",
		encounterId: "ENC-newer",
		encounterType: "Routine Checkup",
		createdBy: "Dr. Okafor",
		recordedAt: Date.UTC(2020, 0, 2),
		createdAt: Date.UTC(2020, 0, 3),
		systolic: 118,
		diastolic: 79,
		heartRate: 72,
		respiratoryRate: 14,
		temperature: 36.5,
		oxygenSaturation: 99,
		weight: 71,
		bmi: 23.2,
		notes: "Follow-up reading.",
	},
	{
		vitalId: "V-older",
		encounterId: "ENC-older",
		encounterType: "Emergency Visit",
		createdBy: "Nurse Ada",
		recordedAt: Date.UTC(2020, 0, 1),
		createdAt: Date.UTC(2020, 0, 1),
		systolic: 120,
		diastolic: 80,
		heartRate: 100,
		respiratoryRate: 16,
		temperature: 37,
		oxygenSaturation: 98,
		weight: 70,
		bmi: 22.9,
		notes: "",
	},
];

const tableCases = [
	{
		name: "allergies",
		rowsKey: "allergies",
		initialRows: allergies,
		first: "Peanuts",
		second: "Latex",
		render: () => (
			<AllergiesClient
				patientId="patient-1"
				allergies={allergies}
				page={1}
				limit={14}
				totalPages={2}
			/>
		),
	},
	{
		name: "diagnoses",
		rowsKey: "diagnoses",
		initialRows: diagnoses,
		first: "Hypertension",
		second: "Asthma",
		render: () => (
			<DiagnosesClient
				patientId="patient-1"
				diagnoses={diagnoses}
				page={1}
				limit={14}
				totalPages={2}
			/>
		),
	},
	{
		name: "encounters",
		rowsKey: "encounters",
		initialRows: encounters,
		first: "ENC-2001",
		second: "ENC-1001",
		render: () => (
			<EncountersClient
				patientId="patient-1"
				encounters={encounters}
				page={1}
				limit={14}
				totalPages={2}
			/>
		),
	},
	{
		name: "imaging",
		rowsKey: "imagingStudies",
		initialRows: imagingStudies,
		first: "Chest X-ray",
		second: "Abdominal Ultrasound",
		render: () => (
			<ImagingClient
				patientId="patient-1"
				imagingStudies={imagingStudies}
				page={1}
				limit={14}
				totalPages={2}
			/>
		),
	},
	{
		name: "immunizations",
		rowsKey: "immunizations",
		initialRows: immunizations,
		first: "Tetanus toxoid",
		second: "Hepatitis B",
		render: () => (
			<ImmunizationsClient
				patientId="patient-1"
				immunizations={immunizations}
				page={1}
				limit={14}
				totalPages={2}
			/>
		),
	},
	{
		name: "lab-tests",
		rowsKey: "labTests",
		initialRows: labTests,
		first: "Hemoglobin A1c",
		second: "Basic Metabolic Panel",
		render: () => (
			<LabTestsClient
				patientId="patient-1"
				labTests={labTests}
				page={1}
				limit={14}
				totalPages={2}
			/>
		),
	},
	{
		name: "medications",
		rowsKey: "medications",
		initialRows: medications,
		first: "Metformin",
		second: "Amoxicillin",
		render: () => (
			<MedicationsClient
				patientId="patient-1"
				medications={medications}
				page={1}
				limit={14}
				totalPages={2}
			/>
		),
	},
	{
		name: "procedures",
		rowsKey: "procedures",
		initialRows: procedures,
		first: "Knee arthroscopy",
		second: "Appendectomy",
		render: () => (
			<ProceduresClient
				patientId="patient-1"
				procedures={procedures}
				page={1}
				limit={14}
				totalPages={2}
			/>
		),
	},
	{
		name: "vitals",
		rowsKey: "vitals",
		initialRows: vitals,
		first: "V-newer",
		second: "V-older",
		render: () => (
			<VitalsClient
				patientId="patient-1"
				vitals={vitals}
				page={1}
				limit={14}
				totalPages={2}
				encounterOptions={[]}
				readings={vitals}
			/>
		),
	},
];

describe.each(tableCases)(
	"$name row loading",
	({ rowsKey, initialRows, first, second, render: renderClient }) => {
		beforeEach(() => {
			vi.stubGlobal(
				"fetch",
				vi.fn(async (input: RequestInfo | URL) => {
					const params = new URL(String(input), "http://localhost").searchParams;
					const page = Number(params.get("page") ?? 1);
					const rows =
						params.get("query") || page === 2 || params.get("createdFrom")
							? [initialRows[1]]
							: [initialRows[0]];
					return Response.json({
						status: "success",
						[rowsKey]: rows,
						page,
						limit: 14,
						totalPages: 2,
					});
				}),
			);
		});

		test("shows matching rows after a search without restoring the initial rows while it loads", async () => {
			render(
				<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
					{renderClient()}
				</SWRConfig>,
			);
			await waitFor(() => {
				expect(within(screen.getByRole("table")).getByText(first)).toBeVisible();
				expect(within(screen.getByRole("table")).queryByText(second)).not.toBeInTheDocument();
			});
			fireEvent.change(screen.getByRole("searchbox"), { target: { value: second } });
			await waitFor(() => {
				expect(within(screen.getByRole("table")).getByText(second)).toBeVisible();
				expect(within(screen.getByRole("table")).queryByText(first)).not.toBeInTheDocument();
			});
			let resolveNextSearch!: (response: Response) => void;
			vi.stubGlobal(
				"fetch",
				vi.fn(
					() =>
						new Promise<Response>((resolve) => {
							resolveNextSearch = resolve;
						}),
				),
			);
			fireEvent.change(screen.getByRole("searchbox"), { target: { value: `${second} another` } });
			await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toBeDisabled());
			expect(within(screen.getByRole("table")).getByText(second)).toBeVisible();
			expect(within(screen.getByRole("table")).queryByText(first)).not.toBeInTheDocument();
			await act(async () =>
				resolveNextSearch(
					Response.json({ status: "success", [rowsKey]: [], page: 1, limit: 14, totalPages: 1 }),
				),
			);
			await waitFor(() =>
				expect(within(screen.getByRole("table")).queryByText(second)).not.toBeInTheDocument(),
			);
		});

		test("shows rows matching an applied date filter and restores rows when it is cleared", async () => {
			const user = userEvent.setup();
			render(
				<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
					{renderClient()}
				</SWRConfig>,
			);
			await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toBeEnabled());
			expect(within(screen.getByRole("table")).getByText(first)).toBeVisible();
			await user.click(screen.getByRole("button", { name: "Filter" }));
			await user.click(screen.getByRole("menuitem", { name: "Created at" }));
			await user.pointer({
				keys: "[TouchA]",
				target: await screen.findByRole("menuitem", { name: "Today" }),
			});
			await user.keyboard("{Escape}");
			await waitFor(() => {
				expect(within(screen.getByRole("table")).getByText(second)).toBeVisible();
				expect(within(screen.getByRole("table")).queryByText(first)).not.toBeInTheDocument();
			});
			await user.keyboard("{Escape}");
			await user.click(screen.getByRole("button", { name: /^Remove Created:/ }));
			await waitFor(() => expect(within(screen.getByRole("table")).getByText(first)).toBeVisible());
		});

		test("shows the next page's rows and can return to the previous page", async () => {
			const user = userEvent.setup();
			render(
				<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
					{renderClient()}
				</SWRConfig>,
			);
			await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toBeEnabled());
			await user.click(screen.getByRole("button", { name: "Next" }));
			await waitFor(() => {
				expect(screen.getByText("Page 2 of 2")).toBeVisible();
				expect(within(screen.getByRole("table")).getByText(second)).toBeVisible();
				expect(within(screen.getByRole("table")).queryByText(first)).not.toBeInTheDocument();
			});
			await user.click(screen.getByRole("button", { name: "Previous" }));
			await waitFor(() => expect(within(screen.getByRole("table")).getByText(first)).toBeVisible());
		});
	},
);

describe("allergy changes", () => {
	test("shows the new row after a successful create in the current encounter", async () => {
		let savedRows = [allergies[0]];
		createAllergy.mockImplementation(async () => {
			savedRows = [
				...savedRows,
				{
					...allergies[0],
					allergyId: "AL-new",
					allergen: "Penicillin",
					reaction: "Facial swelling",
				},
			];
			return { status: "success", allergyId: "AL-new" };
		});
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({
					status: "success",
					allergies: savedRows,
					page: 1,
					limit: 14,
					totalPages: 1,
				}),
			),
		);
		const user = userEvent.setup();
		render(
			<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
				<AllergiesClient
					patientId="patient-1"
					encounterId="ENC-1"
					allergies={[allergies[0]]}
					page={1}
					limit={14}
					totalPages={1}
				/>
			</SWRConfig>,
		);
		expect(await within(screen.getByRole("table")).findByText("Peanuts")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Add allergy" }));
		const drawer = await screen.findByRole("dialog", { name: "Add allergy" });
		await user.type(within(drawer).getByLabelText(/Allergen/), "Penicillin");
		await user.click(within(drawer).getByRole("combobox", { name: /Severity/ }));
		await user.click(await screen.findByRole("option", { name: "Severe" }));
		await user.click(within(drawer).getByRole("combobox", { name: /Status/ }));
		await user.click(await screen.findByRole("option", { name: "Active" }));
		await user.type(within(drawer).getByLabelText(/Reaction/), "Facial swelling");
		await user.click(within(drawer).getByRole("button", { name: "Add allergy" }));
		await waitFor(() =>
			expect(screen.queryByRole("dialog", { name: "Add allergy" })).not.toBeInTheDocument(),
		);
		expect(await within(screen.getByRole("table")).findByText("Penicillin")).toBeVisible();
		expect(within(screen.getByRole("table")).getByText("Peanuts")).toBeVisible();
	});

	test("updates the row and the details drawer after saving an edit", async () => {
		let reaction = "Contact rash on hands";
		updateAllergy.mockImplementation(async () => {
			reaction = "Hives on both hands";
			return { status: "success" };
		});
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: RequestInfo | URL) => {
				if (String(input).includes("patient-allergy-details")) {
					const allergy: AllergyDetailsType = {
						allergyId: "AL-latex",
						encounterId: "ENC-1",
						allergen: "Latex",
						reaction,
						severity: "Mild",
						status: "Inactive",
						createdAt: "Jan 9, 2020",
						updatedAt: "Feb 2, 2020",
						createdBy: "Dr. Ada",
						updatedBy: "Dr. Ada",
						clinicalNote: "Avoid latex gloves.",
						editValues: {
							updatedAt: "2026-01-02T09:00:00.000Z",
							reaction,
							clinicalNote: "Avoid latex gloves.",
						},
						history: [],
					};
					return Response.json({ allergy });
				}
				return Response.json({
					status: "success",
					allergies: [{ ...allergies[1], reaction }],
					page: 1,
					limit: 14,
					totalPages: 1,
				});
			}),
		);
		const user = userEvent.setup();
		render(
			<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
				<AllergiesClient
					patientId="patient-1"
					encounterId="ENC-1"
					allergies={[allergies[1]]}
					page={1}
					limit={14}
					totalPages={1}
				/>
			</SWRConfig>,
		);
		expect(
			await within(screen.getByRole("table")).findByText("Contact rash on hands"),
		).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Open actions for Latex" }));
		await user.click(screen.getByRole("menuitem", { name: "View details" }));
		const dialog = await screen.findByRole("dialog", { name: "Allergy details" });
		await within(dialog).findByRole("heading", { name: "Latex" });
		await user.click(within(dialog).getByRole("button", { name: "Allergy actions" }));
		await user.click(screen.getByRole("menuitem", { name: "Edit" }));
		const editDialog = await screen.findByRole("dialog", { name: "Edit allergies details" });
		const field = within(editDialog).getByLabelText(/Reaction/);
		await user.clear(field);
		await user.type(field, "Hives on both hands");
		await user.click(within(editDialog).getByRole("button", { name: "Save changes" }));
		const details = await screen.findByRole("dialog", { name: "Allergy details" });
		expect(await within(details).findByText("Hives on both hands")).toBeVisible();
		// The row stays mounted behind the drawer and must reflect the same saved reaction.
		await waitFor(() =>
			expect(
				within(screen.getByRole("table", { hidden: true })).getByText("Hives on both hands"),
			).toBeInTheDocument(),
		);
	});
});

test("keeps encounter tables independent while a sibling's request is still loading", async () => {
	let resolveMedication!: (response: Response) => void;
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: RequestInfo | URL) => {
			const url = new URL(String(input), "http://localhost");
			if (url.pathname.includes("patient-medications")) {
				return new Promise<Response>((resolve) => {
					resolveMedication = resolve;
				});
			}
			const rows =
				url.searchParams.get("encounterId") === "ENC-1" ? [allergies[0]] : [allergies[1]];
			return Response.json({
				status: "success",
				allergies: rows,
				page: 1,
				limit: 14,
				totalPages: 1,
			});
		}),
	);
	render(
		<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
			<section aria-label="First encounter allergies">
				<AllergiesClient
					patientId="patient-1"
					encounterId="ENC-1"
					allergies={[]}
					page={1}
					limit={14}
					totalPages={1}
				/>
			</section>
			<section aria-label="Second encounter allergies">
				<AllergiesClient
					patientId="patient-1"
					encounterId="ENC-2"
					allergies={[]}
					page={1}
					limit={14}
					totalPages={1}
				/>
			</section>
			<section aria-label="First encounter medications">
				<MedicationsClient
					patientId="patient-1"
					encounterId="ENC-1"
					medications={[]}
					page={1}
					limit={14}
					totalPages={1}
				/>
			</section>
		</SWRConfig>,
	);
	const first = screen.getByRole("region", { name: "First encounter allergies" });
	const second = screen.getByRole("region", { name: "Second encounter allergies" });
	expect(await within(first).findByText("Peanuts")).toBeVisible();
	expect(await within(second).findByText("Latex")).toBeVisible();
	expect(within(first).queryByText("Latex")).not.toBeInTheDocument();
	expect(within(second).queryByText("Peanuts")).not.toBeInTheDocument();
	await act(async () =>
		resolveMedication(
			Response.json({
				status: "success",
				medications: [medications[0]],
				page: 1,
				limit: 14,
				totalPages: 1,
			}),
		),
	);
	expect(
		await within(screen.getByRole("region", { name: "First encounter medications" })).findByText(
			"Metformin",
		),
	).toBeVisible();
});
