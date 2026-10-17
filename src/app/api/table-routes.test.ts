// @vitest-environment node

import { isDeepStrictEqual } from "node:util";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GET as getAllergies } from "./patient-allergies/[patientId]/route";
import { GET as getDiagnoses } from "./patient-diagnoses/[patientId]/route";
import { GET as getEncounters } from "./patient-encounters/[patientId]/route";
import { GET as getImaging } from "./patient-imaging/[patientId]/route";
import { GET as getImmunizations } from "./patient-immunizations/[patientId]/route";
import { GET as getLabTests } from "./patient-lab-tests/[patientId]/route";
import { GET as getMedications } from "./patient-medications/[patientId]/route";
import { GET as getProcedures } from "./patient-procedures/[patientId]/route";
import { GET as getVitals } from "./patient-vitals/[patientId]/route";
import { GET as getPatients } from "./patients/route";
import { GET as getTransfers } from "./transfers/route";
const { getSessionData, getOrganizationId, getters } = vi.hoisted(() => ({
	getSessionData: vi.fn(),
	getOrganizationId: vi.fn(),
	getters: {
		Allergies: vi.fn(),
		Diagnoses: vi.fn(),
		Encounters: vi.fn(),
		Imaging: vi.fn(),
		Immunizations: vi.fn(),
		LabTests: vi.fn(),
		Medications: vi.fn(),
		Procedures: vi.fn(),
		Vitals: vi.fn(),
		Patients: vi.fn(),
		Transfers: vi.fn(),
	},
}));
vi.mock("@/lib/api/get-session-data", () => ({ getSessionData }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId }));
vi.mock("@/lib/api/get-patient-allergies", () => ({ getPatientAllergies: getters.Allergies }));
vi.mock("@/lib/api/get-patient-diagnoses", () => ({ getPatientDiagnoses: getters.Diagnoses }));
vi.mock("@/lib/api/get-patient-encounters", () => ({ getPatientEncounters: getters.Encounters }));
vi.mock("@/lib/api/get-patient-imaging", () => ({ getPatientImaging: getters.Imaging }));
vi.mock("@/lib/api/get-patient-immunizations", () => ({
	getPatientImmunizations: getters.Immunizations,
}));
vi.mock("@/lib/api/get-patient-lab-tests", () => ({ getPatientLabTests: getters.LabTests }));
vi.mock("@/lib/api/get-patient-medications", () => ({
	getPatientMedications: getters.Medications,
}));
vi.mock("@/lib/api/get-patient-procedures", () => ({ getPatientProcedures: getters.Procedures }));
vi.mock("@/lib/api/get-patient-vitals", () => ({ getPatientVitals: getters.Vitals }));
vi.mock("@/lib/api/get-patients", () => ({ getPatients: getters.Patients }));
vi.mock("@/lib/api/get-transfers", () => ({ getTransfers: getters.Transfers }));
const routes = [
	{
		path: "/api/patient-allergies/patient-1",
		request: (request: Request) =>
			getAllergies(request, { params: Promise.resolve({ patientId: "patient-1" }) }),
		getter: getters.Allergies,
		rowsKey: "allergies",
		totalKey: "totalAllergies",
		filterQuery:
			"createdFrom=2026-10-17&createdTo=2026-10-17&statusFilters=inactive,unknown-filter&severityFilters=severe,unknown-filter&encounterId=encounter-1",
		expectedArgs: [
			"patient-1",
			2,
			1,
			"matching",
			{ createdFrom: "2026-10-17", createdTo: "2026-10-17" },
			["inactive"],
			["severe"],
			"encounter-1",
		],
	},
	{
		path: "/api/patient-diagnoses/patient-1",
		request: (request: Request) =>
			getDiagnoses(request, { params: Promise.resolve({ patientId: "patient-1" }) }),
		getter: getters.Diagnoses,
		rowsKey: "diagnoses",
		totalKey: "totalDiagnoses",
		filterQuery:
			"createdFrom=2026-10-17&createdTo=2026-10-17&diagnosedFrom=2026-10-17&diagnosedTo=2026-10-17&lastReviewedFrom=2026-10-17&lastReviewedTo=2026-10-17&statusFilters=resolved,unknown-filter&encounterId=encounter-1",
		expectedArgs: [
			"patient-1",
			2,
			1,
			"matching",
			{
				createdFrom: "2026-10-17",
				createdTo: "2026-10-17",
				diagnosedFrom: "2026-10-17",
				diagnosedTo: "2026-10-17",
				lastReviewedFrom: "2026-10-17",
				lastReviewedTo: "2026-10-17",
			},
			["resolved"],
			"encounter-1",
		],
	},
	{
		path: "/api/patient-encounters/patient-1",
		request: (request: Request) =>
			getEncounters(request, { params: Promise.resolve({ patientId: "patient-1" }) }),
		getter: getters.Encounters,
		rowsKey: "encounters",
		totalKey: "totalEncounters",
		filterQuery:
			"encounterFrom=2026-10-17&encounterTo=2026-10-17&createdFrom=2026-10-17&createdTo=2026-10-17&encounterTypeFilters=follow-up-visit,unknown-filter&departmentFilters=cardiology,unknown-filter",
		expectedArgs: [
			"patient-1",
			2,
			1,
			"matching",
			{
				encounterFrom: "2026-10-17",
				encounterTo: "2026-10-17",
				createdFrom: "2026-10-17",
				createdTo: "2026-10-17",
			},
			["follow-up-visit"],
			["cardiology"],
		],
	},
	{
		path: "/api/patient-imaging/patient-1",
		request: (request: Request) =>
			getImaging(request, { params: Promise.resolve({ patientId: "patient-1" }) }),
		getter: getters.Imaging,
		rowsKey: "imagingStudies",
		totalKey: "totalImagingStudies",
		filterQuery:
			"orderedFrom=2026-10-17&orderedTo=2026-10-17&createdFrom=2026-10-17&createdTo=2026-10-17&statusFilters=completed,unknown-filter&modalityFilters=ct,unknown-filter&encounterId=encounter-1",
		expectedArgs: [
			"patient-1",
			2,
			1,
			"matching",
			{
				orderedFrom: "2026-10-17",
				orderedTo: "2026-10-17",
				createdFrom: "2026-10-17",
				createdTo: "2026-10-17",
			},
			["completed"],
			["ct"],
			"encounter-1",
		],
	},
	{
		path: "/api/patient-immunizations/patient-1",
		request: (request: Request) =>
			getImmunizations(request, { params: Promise.resolve({ patientId: "patient-1" }) }),
		getter: getters.Immunizations,
		rowsKey: "immunizations",
		totalKey: "totalImmunizations",
		filterQuery:
			"createdFrom=2026-10-17&createdTo=2026-10-17&statusFilters=completed,unknown-filter&encounterId=encounter-1",
		expectedArgs: [
			"patient-1",
			2,
			1,
			"matching",
			{ createdFrom: "2026-10-17", createdTo: "2026-10-17" },
			["completed"],
			"encounter-1",
		],
	},
	{
		path: "/api/patient-lab-tests/patient-1",
		request: (request: Request) =>
			getLabTests(request, { params: Promise.resolve({ patientId: "patient-1" }) }),
		getter: getters.LabTests,
		rowsKey: "labTests",
		totalKey: "totalLabTests",
		filterQuery:
			"createdFrom=2026-10-17&createdTo=2026-10-17&statusFilters=completed,unknown-filter&flagFilters=high,unknown-filter&encounterId=encounter-1",
		expectedArgs: [
			"patient-1",
			2,
			1,
			"matching",
			{ createdFrom: "2026-10-17", createdTo: "2026-10-17" },
			["completed"],
			["high"],
			"encounter-1",
		],
	},
	{
		path: "/api/patient-medications/patient-1",
		request: (request: Request) =>
			getMedications(request, { params: Promise.resolve({ patientId: "patient-1" }) }),
		getter: getters.Medications,
		rowsKey: "medications",
		totalKey: "totalMedications",
		filterQuery:
			"createdFrom=2026-10-17&createdTo=2026-10-17&statusFilters=completed,unknown-filter&encounterId=encounter-1",
		expectedArgs: [
			"patient-1",
			2,
			1,
			"matching",
			{ createdFrom: "2026-10-17", createdTo: "2026-10-17" },
			["completed"],
			"encounter-1",
		],
	},
	{
		path: "/api/patient-procedures/patient-1",
		request: (request: Request) =>
			getProcedures(request, { params: Promise.resolve({ patientId: "patient-1" }) }),
		getter: getters.Procedures,
		rowsKey: "procedures",
		totalKey: "totalProcedures",
		filterQuery:
			"createdFrom=2026-10-17&createdTo=2026-10-17&statusFilters=completed,unknown-filter&encounterId=encounter-1",
		expectedArgs: [
			"patient-1",
			2,
			1,
			"matching",
			{ createdFrom: "2026-10-17", createdTo: "2026-10-17" },
			["completed"],
			"encounter-1",
		],
	},
	{
		path: "/api/patient-vitals/patient-1",
		request: (request: Request) =>
			getVitals(request, { params: Promise.resolve({ patientId: "patient-1" }) }),
		getter: getters.Vitals,
		rowsKey: "vitals",
		totalKey: "totalVitals",
		filterQuery:
			"recordedFrom=2026-10-17&recordedTo=2026-10-17&createdFrom=2026-10-17&createdTo=2026-10-17&encounterId=encounter-1",
		expectedArgs: [
			"patient-1",
			2,
			1,
			"matching",
			{
				recordedFrom: "2026-10-17",
				recordedTo: "2026-10-17",
				createdFrom: "2026-10-17",
				createdTo: "2026-10-17",
			},
			"encounter-1",
		],
	},
	{
		path: "/api/patients",
		request: getPatients,
		getter: getters.Patients,
		rowsKey: "patients",
		totalKey: "totalPatients",
		filterQuery: "createdFrom=2026-10-17&createdTo=2026-10-17&gender=female&ageGroup=adults",
		expectedArgs: [
			2,
			1,
			"matching",
			{ from: new Date(2026, 9, 17), to: new Date(2026, 9, 17, 23, 59, 59, 999) },
			{ gender: "female", ageRange: { min: 36, max: 59 } },
		],
	},
	{
		path: "/api/transfers",
		request: getTransfers,
		getter: getters.Transfers,
		rowsKey: "transfers",
		totalKey: "totalTransfers",
		filterQuery: "requestedFrom=2026-10-17&requestedTo=2026-10-17&status=completed,unknown-filter",
		expectedArgs: [
			2,
			1,
			"matching",
			{ from: new Date(2026, 9, 17), to: new Date(2026, 9, 17, 23, 59, 59, 999) },
			["completed"],
		],
	},
];
afterEach(() => vi.restoreAllMocks());
describe.each(routes)(
	"GET $path",
	({ path, request, getter, rowsKey, totalKey, filterQuery, expectedArgs }) => {
		beforeEach(() => {
			vi.resetAllMocks();
			getSessionData.mockResolvedValue({ user: { id: "user-1", emailVerified: true } });
			getOrganizationId.mockResolvedValue("hospital-1");
			getter.mockResolvedValue({ [rowsKey]: [], [totalKey]: 0 });
		});

		test("returns rows selected by the patient, encounter, search and all table filters", async () => {
			const selectedRow = { id: "matching-record" };
			getter.mockImplementation(async (...args: unknown[]) => ({
				[rowsKey]: isDeepStrictEqual(args, expectedArgs) ? [selectedRow] : [],
				[totalKey]: 3,
			}));
			const response = await request(
				new Request(`http://localhost${path}?page=2&limit=1&query=matching&${filterQuery}`),
			);
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({
				status: "success",
				[rowsKey]: [selectedRow],
				page: 2,
				limit: 1,
				totalPages: 3,
			});
		});

		test("returns an empty first page when no records match", async () => {
			const response = await request(new Request(`http://localhost${path}`));
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({
				status: "success",
				[rowsKey]: [],
				page: 1,
				limit: 14,
				totalPages: 1,
			});
		});

		test.each([
			["page=invalid&limit=invalid", 1, 14],
			["page=-1&limit=0", 1, 1],
			["page=2&limit=1000", 2, 100],
		])("normalizes pagination from %s", async (query, page, limit) => {
			const response = await request(new Request(`http://localhost${path}?${query}`));
			expect(response.status).toBe(200);
			expect(await response.json()).toMatchObject({ status: "success", page, limit });
		});

		test.each([
			["signed out", null, "hospital-1", 401, "Sign in to view patient records."],
			[
				"unverified email",
				{ user: { id: "user-1", emailVerified: false } },
				"hospital-1",
				403,
				"Verify your email before you can view patient records.",
			],
			[
				"no verified hospital membership",
				{ user: { id: "user-1", emailVerified: true } },
				null,
				403,
				"Your hospital must be verified before you can view patient records.",
			],
		])("denies a reader with %s", async (_, session, organizationId, status, error) => {
			getSessionData.mockResolvedValue(session);
			getOrganizationId.mockResolvedValue(organizationId);
			const response = await request(new Request(`http://localhost${path}`));
			expect(response.status).toBe(status);
			expect(await response.json()).toEqual({ status: "failed", error });
			expect(getter).not.toHaveBeenCalled();
		});

		test("returns a fixed error without exposing database details", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			getter.mockRejectedValue(new Error("private database connection details"));
			const response = await request(new Request(`http://localhost${path}`));
			expect(response.status).toBe(500);
			const result = await response.json();
			expect(result).toMatchObject({
				status: "failed",
				error: expect.stringMatching(/^Unable to load /),
			});
			expect(JSON.stringify(result)).not.toContain("private database");
		});
	},
);
