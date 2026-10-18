import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense, use, useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	AllergiesClient,
	DiagnosesClient,
	EncountersClient,
	ImagingClient,
	ImmunizationsClient,
	LabTestsClient,
	MedicationsClient,
	ProceduresClient,
	VitalsClient,
} from "./index";
import { EncounterTableNavigation } from "./encounter-table-navigation";
import type {
	AllergyType,
	DiagnosisType,
	EncounterType,
	ImagingType,
	ImmunizationType,
	LabTestType,
	MedicationType,
	ProcedureType,
	VitalType,
} from "@/features/patients/types";

const navigation = vi.hoisted(() => ({
	pathname: "/dashboard/patients/patient-1/encounters/ENC-1",
	params: "created=true&medicationsPage=3&medicationsQuery=aspirin",
	push: vi.fn(),
	replace: vi.fn(),
	refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
	useRouter: () => navigation,
	usePathname: () => navigation.pathname,
	useSearchParams: () => new URLSearchParams(navigation.params),
}));
vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: "owner" } }),
		useSession: () => ({ data: { user: { name: "Dr. Okafor" } } }),
	},
}));
vi.mock("@/features/patients/server/create-patient-allergy-action", () => ({
	createPatientAllergyAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-allergy-action", () => ({
	updatePatientAllergyAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-diagnosis-action", () => ({
	createPatientDiagnosisAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-diagnosis-action", () => ({
	updatePatientDiagnosisAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-encounter-action", () => ({
	createPatientEncounterAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-imaging-action", () => ({
	createPatientImagingAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-imaging-action", () => ({
	updatePatientImagingAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-immunization-action", () => ({
	createPatientImmunizationAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-immunization-action", () => ({
	updatePatientImmunizationAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-lab-test-action", () => ({
	createPatientLabTestAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-lab-test-action", () => ({
	updatePatientLabTestAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-medication-action", () => ({
	createPatientMedicationAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-medication-action", () => ({
	updatePatientMedicationAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-procedure-action", () => ({
	createPatientProcedureAction: vi.fn(),
}));
vi.mock("@/features/patients/server/update-patient-procedure-action", () => ({
	updatePatientProcedureAction: vi.fn(),
}));
vi.mock("@/features/patients/server/create-patient-vital-action", () => ({
	createPatientVitalAction: vi.fn(),
}));

const allergiesRow = {
	allergen: "Peanuts",
	allergyId: "AL-peanut",
	reaction: "Anaphylaxis",
	createdAtLabel: "Mar 3, 2021",
	createdAtSortValue: "2021-03-03",
	severity: "Severe",
	status: "Active",
} satisfies AllergyType;

const diagnosesRow = {
	name: "Hypertension",
	diagnosedAtLabel: "Jan 5, 2020",
	diagnosedAtSortValue: "2020-01-05",
	lastReviewedLabel: "Mar 1, 2020",
	lastReviewedSortValue: "2020-03-01",
	diagnosisId: "DX-hyper",
	createdAtLabel: "Jan 6, 2020",
	createdAtSortValue: "2020-01-06",
	status: "Active",
} satisfies DiagnosisType;

const encountersRow = {
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
} satisfies EncounterType;

const imagingStudiesRow = {
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
} satisfies ImagingType;

const immunizationsRow = {
	vaccineName: "Tetanus toxoid",
	immunizationId: "IMM-3001",
	dose: "Dose 2 of 3",
	createdAtLabel: "Mar 5, 2024",
	createdAtSortValue: "2024-03-05",
	status: "Active",
} satisfies ImmunizationType;

const labTestsRow = {
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
} satisfies LabTestType;

const medicationsRow = {
	medication: "Metformin",
	dose: "500 mg",
	route: "Oral",
	medicationId: "MED-metformin",
	indication: "Type 2 diabetes",
	createdAtLabel: "Apr 2, 2021",
	createdAtSortValue: "2021-04-02",
	status: "Active",
} satisfies MedicationType;

const proceduresRow = {
	procedure: "Knee arthroscopy",
	procedureId: "PROC-3001",
	createdAtLabel: "Mar 5, 2024",
	createdAtSortValue: "2024-03-05",
	indication: "Persistent right knee pain",
	facility: "Orthopaedic Day Surgery",
	status: "Pending",
} satisfies ProcedureType;

const vitalsRow = {
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
} satisfies VitalType;

type NavigationProps = { page: number; limit: number; searchQuery: string };
const tableCases = [
	{
		name: "allergies",
		prefix: "allergies",
		rowText: "Peanuts",
		renderTable: (props: NavigationProps) => (
			<AllergiesClient
				patientId="patient-1"
				encounterId="ENC-1"
				allergies={[allergiesRow]}
				totalPages={4}
				{...props}
			/>
		),
	},
	{
		name: "diagnoses",
		prefix: "diagnoses",
		rowText: "Hypertension",
		renderTable: (props: NavigationProps) => (
			<DiagnosesClient
				patientId="patient-1"
				encounterId="ENC-1"
				diagnoses={[diagnosesRow]}
				totalPages={4}
				{...props}
			/>
		),
	},
	{
		name: "encounters",
		prefix: "encounters",
		rowText: "Routine Checkup",
		renderTable: (props: NavigationProps) => (
			<EncountersClient
				patientId="patient-1"
				encounters={[encountersRow]}
				totalPages={4}
				{...props}
			/>
		),
	},
	{
		name: "imaging",
		prefix: "imaging",
		rowText: "Chest X-ray",
		renderTable: (props: NavigationProps) => (
			<ImagingClient
				patientId="patient-1"
				encounterId="ENC-1"
				imagingStudies={[imagingStudiesRow]}
				totalPages={4}
				{...props}
			/>
		),
	},
	{
		name: "immunizations",
		prefix: "immunizations",
		rowText: "Tetanus toxoid",
		renderTable: (props: NavigationProps) => (
			<ImmunizationsClient
				patientId="patient-1"
				encounterId="ENC-1"
				immunizations={[immunizationsRow]}
				totalPages={4}
				{...props}
			/>
		),
	},
	{
		name: "lab-tests",
		prefix: "labTests",
		rowText: "Hemoglobin A1c",
		renderTable: (props: NavigationProps) => (
			<LabTestsClient
				patientId="patient-1"
				encounterId="ENC-1"
				labTests={[labTestsRow]}
				totalPages={4}
				{...props}
			/>
		),
	},
	{
		name: "medications",
		prefix: "medications",
		rowText: "Metformin",
		renderTable: (props: NavigationProps) => (
			<MedicationsClient
				patientId="patient-1"
				encounterId="ENC-1"
				medications={[medicationsRow]}
				totalPages={4}
				{...props}
			/>
		),
	},
	{
		name: "procedures",
		prefix: "procedures",
		rowText: "Knee arthroscopy",
		renderTable: (props: NavigationProps) => (
			<ProceduresClient
				patientId="patient-1"
				encounterId="ENC-1"
				procedures={[proceduresRow]}
				totalPages={4}
				{...props}
			/>
		),
	},
	{
		name: "vitals",
		prefix: "vitals",
		rowText: "V-newer",
		renderTable: (props: NavigationProps) => (
			<VitalsClient
				patientId="patient-1"
				encounterOptions={[]}
				readings={[vitalsRow]}
				encounterId="ENC-1"
				vitals={[vitalsRow]}
				totalPages={4}
				{...props}
			/>
		),
	},
];

beforeEach(() => {
	navigation.params = "created=true&medicationsPage=3&medicationsQuery=aspirin";
	navigation.push.mockReset();
	navigation.replace.mockReset();
	navigation.refresh.mockReset();
});
afterEach(() => {
	vi.useRealTimers();
});

describe.each(tableCases)("URL-driven $name table", ({ prefix, rowText, renderTable }) => {
	test("keeps the server's rows visible and pushes a namespaced page URL without changing other tables", async () => {
		const user = userEvent.setup();
		const { rerender } = render(renderTable({ page: 2, limit: 14, searchQuery: "" }));
		expect(within(screen.getByRole("table")).getByText(rowText)).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Next" }));
		const [href, options] = navigation.push.mock.calls[0];
		const url = new URL(href, "http://localhost");
		expect(url.pathname).toBe(navigation.pathname);
		expect(url.searchParams.get(`${prefix}Page`)).toBe("3");
		expect(url.searchParams.get(`${prefix}Limit`)).toBe("14");
		expect(url.searchParams.get("created")).toBe("true");
		if (prefix !== "medications") {
			expect(url.searchParams.get("medicationsPage")).toBe("3");
			expect(url.searchParams.get("medicationsQuery")).toBe("aspirin");
		}
		expect(options).toEqual({ scroll: false });
		expect(navigation.replace).not.toHaveBeenCalled();
		expect(within(screen.getByRole("table")).getByText(rowText)).toBeVisible();
		rerender(renderTable({ page: 3, limit: 14, searchQuery: "" }));
		expect(screen.getByText("Page 3 of 4")).toBeVisible();
	});

	test("debounces search and restores the input when revisiting URL history", async () => {
		vi.useFakeTimers();
		const { rerender } = render(renderTable({ page: 2, limit: 14, searchQuery: "" }));
		const input = screen.getByRole("searchbox");
		fireEvent.change(input, { target: { value: "new search" } });
		expect(input).toHaveValue("new search");
		expect(navigation.replace).not.toHaveBeenCalled();
		await act(async () => {
			vi.advanceTimersByTime(300);
		});
		const [href, options] = navigation.replace.mock.calls[0];
		const params = new URL(href, "http://localhost").searchParams;
		expect(params.get(`${prefix}Query`)).toBe("new search");
		expect(params.get(`${prefix}Page`)).toBe("1");
		expect(options).toEqual({ scroll: false });
		expect(navigation.push).not.toHaveBeenCalled();
		expect(within(screen.getByRole("table")).getByText(rowText)).toBeVisible();
		rerender(renderTable({ page: 1, limit: 14, searchQuery: "new search" }));
		rerender(renderTable({ page: 2, limit: 14, searchQuery: "" }));
		expect(input).toHaveValue("");
		rerender(renderTable({ page: 1, limit: 14, searchQuery: "new search" }));
		expect(input).toHaveValue("new search");
		fireEvent.change(input, { target: { value: "unfinished draft" } });
		rerender(renderTable({ page: 1, limit: 14, searchQuery: "restored" }));
		expect(input).toHaveValue("restored");
		await act(async () => {
			vi.advanceTimersByTime(300);
		});
		expect(navigation.replace).toHaveBeenCalledTimes(1);
	});
});

test("preserves newer input when the previous search response arrives", async () => {
	vi.useFakeTimers();
	const props = {
		patientId: "patient-1",
		page: 1,
		limit: 14,
		totalPages: 1,
		allergies: [allergiesRow],
	};
	const { rerender } = render(<AllergiesClient {...props} searchQuery="" />);
	const input = screen.getByRole("searchbox");
	fireEvent.change(input, { target: { value: "pen" } });
	await act(async () => {
		vi.advanceTimersByTime(300);
	});
	expect(
		new URL(navigation.replace.mock.calls[0][0], "http://localhost").searchParams.get(
			"allergiesQuery",
		),
	).toBe("pen");
	fireEvent.change(input, { target: { value: "penicillin" } });
	rerender(<AllergiesClient {...props} searchQuery="pen" />);
	expect(input).toHaveValue("penicillin");
	await act(async () => {
		vi.advanceTimersByTime(300);
	});
	expect(
		new URL(navigation.replace.mock.calls[1][0], "http://localhost").searchParams.get(
			"allergiesQuery",
		),
	).toBe("penicillin");
});

test("replaces displayed rows as soon as fresh server props arrive", () => {
	const props = { patientId: "patient-1", page: 1, limit: 14, totalPages: 1 };
	const { rerender } = render(<AllergiesClient {...props} allergies={[allergiesRow]} />);
	expect(within(screen.getByRole("table")).getByText("Peanuts")).toBeVisible();
	rerender(
		<AllergiesClient {...props} allergies={[{ ...allergiesRow, allergen: "Penicillin" }]} />,
	);
	expect(within(screen.getByRole("table")).getByText("Penicillin")).toBeVisible();
	expect(within(screen.getByRole("table")).queryByText("Peanuts")).not.toBeInTheDocument();
	expect(navigation.push).not.toHaveBeenCalled();
	expect(navigation.replace).not.toHaveBeenCalled();
});

test("shows the filter pill and pending page immediately while navigation waits for the server", async () => {
	let finishNavigation!: () => void;
	const route = new Promise<void>((resolve) => {
		finishNavigation = resolve;
	});
	function PendingRoute() {
		use(route);
		return null;
	}
	function RouterHarness({ children }: { children: ReactNode }) {
		const [isNavigating, setIsNavigating] = useState(false);
		navigation.push.mockImplementation(() => setIsNavigating(true));
		return (
			<>
				{children}
				{isNavigating && <PendingRoute />}
			</>
		);
	}
	const user = userEvent.setup();
	render(
		<Suspense fallback="Loading route">
			<RouterHarness>
				<AllergiesClient
					patientId="patient-1"
					encounterId="ENC-1"
					allergies={[allergiesRow]}
					page={2}
					limit={14}
					totalPages={4}
				/>
			</RouterHarness>
		</Suspense>,
	);
	await user.click(screen.getByRole("button", { name: "Filter" }));
	await user.click(screen.getByRole("menuitem", { name: "Status" }));
	await user.pointer({
		keys: "[TouchA]",
		target: screen.getByRole("checkbox", { name: "Active" }),
	});
	await user.keyboard("{Escape}{Escape}");
	expect(screen.getByText("Status: Active")).toBeVisible();
	expect(screen.getByText("Page 1 of 4")).toBeVisible();
	expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
	expect(within(screen.getByRole("table")).getByText("Peanuts")).toBeVisible();
	const params = new URL(navigation.push.mock.calls[0][0], "http://localhost").searchParams;
	expect(params.get("allergiesStatus")).toBe("active");
	expect(params.get("medicationsQuery")).toBe("aspirin");
	await act(async () => {
		finishNavigation();
		await route;
	});
});

test("changing the second encounter table preserves the first table's pending page", async () => {
	let finishNavigation!: () => void;
	const route = new Promise<void>((resolve) => {
		finishNavigation = resolve;
	});
	function PendingRoute() {
		use(route);
		return null;
	}
	function RouterHarness({ children }: { children: ReactNode }) {
		const [isNavigating, setIsNavigating] = useState(false);
		navigation.push.mockImplementation(() => setIsNavigating(true));
		return (
			<>
				{children}
				{isNavigating && <PendingRoute />}
			</>
		);
	}
	const user = userEvent.setup();
	render(
		<Suspense fallback="Loading route">
			<RouterHarness>
				<EncounterTableNavigation>
					<section aria-label="Allergies">
						<AllergiesClient
							patientId="patient-1"
							encounterId="ENC-1"
							allergies={[allergiesRow]}
							page={1}
							limit={14}
							totalPages={4}
						/>
					</section>
					<section aria-label="Medications">
						<MedicationsClient
							patientId="patient-1"
							encounterId="ENC-1"
							medications={[medicationsRow]}
							page={3}
							limit={14}
							totalPages={4}
							searchQuery="aspirin"
						/>
					</section>
				</EncounterTableNavigation>
			</RouterHarness>
		</Suspense>,
	);
	await act(async () => {
		await user.click(
			within(screen.getByRole("region", { name: "Allergies" })).getByRole("button", {
				name: "Next",
			}),
		);
	});
	expect(
		within(screen.getByRole("region", { name: "Allergies" })).getByText("Page 2 of 4"),
	).toBeVisible();
	await act(async () => {
		await user.click(
			within(screen.getByRole("region", { name: "Medications" })).getByRole("button", {
				name: "Next",
			}),
		);
	});
	const lastHref = navigation.push.mock.calls.at(-1)![0];
	await act(async () => {
		finishNavigation();
		await route;
	});
	const finalParams = new URL(lastHref, "http://localhost").searchParams;
	expect(finalParams.get("medicationsPage")).toBe("4");
	expect(finalParams.get("allergiesPage")).toBe("2");
	// The response kept the original props, as when a navigation is abandoned.
	await waitFor(() =>
		expect(
			within(screen.getByRole("region", { name: "Medications" })).getByRole("button", {
				name: "Next",
			}),
		).toBeEnabled(),
	);
	await act(async () => {
		await user.click(
			within(screen.getByRole("region", { name: "Medications" })).getByRole("button", {
				name: "Next",
			}),
		);
	});
	const retryParams = new URL(navigation.push.mock.calls.at(-1)![0], "http://localhost")
		.searchParams;
	expect(retryParams.get("medicationsPage")).toBe("4");
	expect(retryParams.get("allergiesPage")).toBeNull();
});

test("clearing search during a pending request updates the latest destination", async () => {
	vi.useFakeTimers();
	let finishNavigation!: () => void;
	const route = new Promise<void>((resolve) => {
		finishNavigation = resolve;
	});
	function PendingRoute() {
		use(route);
		return null;
	}
	function RouterHarness({ children }: { children: ReactNode }) {
		const [isNavigating, setIsNavigating] = useState(false);
		navigation.replace.mockImplementation(() => setIsNavigating(true));
		return (
			<>
				{children}
				{isNavigating && <PendingRoute />}
			</>
		);
	}
	render(
		<Suspense fallback="Loading route">
			<RouterHarness>
				<AllergiesClient
					patientId="patient-1"
					allergies={[allergiesRow]}
					page={1}
					limit={14}
					totalPages={4}
				/>
			</RouterHarness>
		</Suspense>,
	);
	const input = screen.getByRole("searchbox");
	fireEvent.change(input, { target: { value: "pen" } });
	await act(async () => {
		vi.advanceTimersByTime(300);
	});
	expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
	fireEvent.change(input, { target: { value: "" } });
	await act(async () => {
		vi.advanceTimersByTime(300);
	});
	expect(input).toHaveValue("");
	const lastHref = navigation.replace.mock.calls.at(-1)![0];
	await act(async () => {
		finishNavigation();
		await route;
	});
	expect(new URL(lastHref, "http://localhost").searchParams.get("allergiesQuery")).toBeNull();
});
