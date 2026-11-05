// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
	patientImaging,
	patientImagingFile,
	patientLabTest,
	patientLabTestFile,
	patientRecordAccess,
	type PatientRecordAccessSection,
} from "@/db/schemas";
import { GET as getAllergy } from "./route";
import { GET as getDiagnosis } from "../../../shared-diagnosis-details/[accessId]/[diagnosisId]/route";
import { GET as getImaging } from "../../../shared-imaging-details/[accessId]/[imagingId]/route";
import { GET as getImmunization } from "../../../shared-immunization-details/[accessId]/[immunizationId]/route";
import { GET as getLabTest } from "../../../shared-lab-test-details/[accessId]/[labTestId]/route";
import { GET as getMedication } from "../../../shared-medication-details/[accessId]/[medicationId]/route";
import { GET as getProcedure } from "../../../shared-procedure-details/[accessId]/[procedureId]/route";

const { database, hasVerifiedSession, hospitalRecords } = vi.hoisted(() => ({
	database: {
		access: null as Record<string, unknown> | null,
		records: new Map<unknown, Record<string, unknown>[]>(),
		queriedTables: new Set<unknown>(),
	},
	hasVerifiedSession: vi.fn(),
	hospitalRecords: {
		allergy: vi.fn(),
		diagnosis: vi.fn(),
		immunization: vi.fn(),
		medication: vi.fn(),
		procedure: vi.fn(),
	},
}));

vi.mock("@/lib/api/external-access-session", () => ({
	hasVerifiedExternalAccessSession: hasVerifiedSession,
}));
vi.mock("@/lib/api/get-patient-allergy-details", () => ({
	getPatientAllergyDetailsForOrganization: hospitalRecords.allergy,
}));
vi.mock("@/lib/api/get-patient-diagnosis-details", () => ({
	getPatientDiagnosisDetailsForOrganization: hospitalRecords.diagnosis,
}));
vi.mock("@/lib/api/get-patient-immunization-details", () => ({
	getPatientImmunizationDetailsForOrganization: hospitalRecords.immunization,
}));
vi.mock("@/lib/api/get-patient-medication-details", () => ({
	getPatientMedicationDetailsForOrganization: hospitalRecords.medication,
}));
vi.mock("@/lib/api/get-patient-procedure-details", () => ({
	getPatientProcedureDetailsForOrganization: hospitalRecords.procedure,
}));
vi.mock("@/lib/better-auth/auth", () => ({
	db: {
		select: () => ({
			from(table: unknown) {
				database.queriedTables.add(table);
				const rows =
					table === patientRecordAccess
						? database.access
							? [database.access]
							: []
						: (database.records.get(table) ?? []);
				const query = {
					innerJoin: () => query,
					where: () => Object.assign(Promise.resolve(rows), { orderBy: async () => rows }),
				};
				return query;
			},
		}),
	},
}));

const createdAt = new Date("2026-10-01T09:00:00.000Z");
const recordRoutes: {
	section: PatientRecordAccessSection;
	recordId: string;
	responseKey: string;
	request: (recordId: string) => Promise<Response>;
	shareRecord: () => void;
	expectedDetails: Record<string, unknown>;
}[] = [
	{
		section: "allergies",
		recordId: "ALG-1",
		responseKey: "allergy",
		request: (allergyId) =>
			getAllergy(new Request("http://localhost"), {
				params: Promise.resolve({ accessId: "access-1", allergyId }),
			}),
		shareRecord: () =>
			hospitalRecords.allergy.mockResolvedValue({ allergyId: "ALG-1", allergen: "Penicillin" }),
		expectedDetails: { allergyId: "ALG-1", allergen: "Penicillin" },
	},
	{
		section: "diagnoses",
		recordId: "DIA-1",
		responseKey: "diagnosis",
		request: (diagnosisId) =>
			getDiagnosis(new Request("http://localhost"), {
				params: Promise.resolve({ accessId: "access-1", diagnosisId }),
			}),
		shareRecord: () =>
			hospitalRecords.diagnosis.mockResolvedValue({
				diagnosisId: "DIA-1",
				name: "Asthma",
				relatedRecords: { medications: [], labTests: [], imaging: [], procedures: [] },
			}),
		expectedDetails: { diagnosisId: "DIA-1", name: "Asthma" },
	},
	{
		section: "immunizations",
		recordId: "IMM-1",
		responseKey: "immunization",
		request: (immunizationId) =>
			getImmunization(new Request("http://localhost"), {
				params: Promise.resolve({ accessId: "access-1", immunizationId }),
			}),
		shareRecord: () =>
			hospitalRecords.immunization.mockResolvedValue({
				immunizationId: "IMM-1",
				vaccineName: "Tetanus",
			}),
		expectedDetails: { immunizationId: "IMM-1", vaccineName: "Tetanus" },
	},
	{
		section: "medications",
		recordId: "MED-1",
		responseKey: "medication",
		request: (medicationId) =>
			getMedication(new Request("http://localhost"), {
				params: Promise.resolve({ accessId: "access-1", medicationId }),
			}),
		shareRecord: () =>
			hospitalRecords.medication.mockResolvedValue({ medicationId: "MED-1", name: "Aspirin" }),
		expectedDetails: { medicationId: "MED-1", name: "Aspirin" },
	},
	{
		section: "procedures",
		recordId: "PRO-1",
		responseKey: "procedure",
		request: (procedureId) =>
			getProcedure(new Request("http://localhost"), {
				params: Promise.resolve({ accessId: "access-1", procedureId }),
			}),
		shareRecord: () =>
			hospitalRecords.procedure.mockResolvedValue({
				procedureId: "PRO-1",
				name: "Appendectomy",
				relatedRecords: { diagnosis: null, medication: null },
			}),
		expectedDetails: { procedureId: "PRO-1", name: "Appendectomy" },
	},
	{
		section: "lab-tests",
		recordId: "LAB-1",
		responseKey: "labTest",
		request: (labTestId) =>
			getLabTest(new Request("http://localhost"), {
				params: Promise.resolve({ accessId: "access-1", labTestId }),
			}),
		shareRecord: () => {
			database.records.set(patientLabTest, [
				{
					id: "LAB-1",
					testName: "Full blood count",
					result: "Normal",
					status: "completed",
					orderedAt: null,
					createdAt,
					updatedAt: createdAt,
				},
			]);
			database.records.set(patientLabTestFile, [
				{ id: "FILE-1", name: "Report.pdf", type: "application/pdf", uploadedAt: createdAt },
			]);
		},
		expectedDetails: {
			labId: "LAB-1",
			test: "Full blood count - Normal",
			status: "Completed",
			files: [expect.objectContaining({ url: "/api/shared-record-files/access-1/lab/FILE-1" })],
		},
	},
	{
		section: "imaging",
		recordId: "IMG-1",
		responseKey: "imaging",
		request: (imagingId) =>
			getImaging(new Request("http://localhost"), {
				params: Promise.resolve({ accessId: "access-1", imagingId }),
			}),
		shareRecord: () => {
			database.records.set(patientImaging, [
				{
					id: "IMG-1",
					study: "Chest X-ray",
					modality: "X-ray",
					region: "Chest",
					status: "completed",
					orderedAt: null,
					createdAt,
					updatedAt: createdAt,
				},
			]);
			database.records.set(patientImagingFile, [
				{ id: "FILE-2", name: "Chest.png", type: "image/png", uploadedAt: createdAt },
			]);
		},
		expectedDetails: {
			imagingId: "IMG-1",
			study: "Chest X-ray",
			files: [expect.objectContaining({ url: "/api/shared-record-files/access-1/imaging/FILE-2" })],
		},
	},
];

beforeEach(() => {
	database.queriedTables.clear();
	database.records.clear();
	hasVerifiedSession.mockResolvedValue(true);
	database.access = {
		patientId: "patient-1",
		organizationId: "hospital-1",
		status: "active",
		expiresAt: new Date(Date.now() + 60_000),
		revokedAt: null,
		sourceOrganizationName: "Source Hospital",
		firstName: "Ada",
		lastName: "Obi",
		sex: "female",
		age: 34,
		selectedRecordIds: recordRoutes.map(({ section, recordId }) => ({ section, recordId })),
	};
});

describe.each(recordRoutes)(
	"shared $section details",
	({ section, recordId, responseKey, request, shareRecord, expectedDetails }) => {
		test("a verified viewer reads a record the link shared", async () => {
			shareRecord();

			const response = await request(recordId);

			expect(response.status).toBe(200);
			expect((await response.json())[responseKey]).toMatchObject(expectedDetails);
		});

		test("a record the link did not share is refused without reading it", async () => {
			shareRecord();
			const otherSection = section === "allergies" ? "medications" : "allergies";
			database.access!.selectedRecordIds = [
				{ section, recordId: "SHARED-OTHER" },
				{ section: otherSection, recordId },
			];

			const response = await request(recordId);

			expect(response.status).toBe(404);
			expect(await response.json()).toEqual({ [responseKey]: null });
			expect(database.queriedTables).toEqual(new Set([patientRecordAccess]));
			for (const readHospitalRecord of Object.values(hospitalRecords)) {
				expect(readHospitalRecord).not.toHaveBeenCalled();
			}
		});

		test.each([
			{ status: "pending" },
			{ status: "revoked" },
			{ revokedAt: new Date() },
			{ expiresAt: new Date(0) },
		])("an invalid link %j is refused without reading the record", async (access) => {
			shareRecord();
			Object.assign(database.access!, access);

			const response = await request(recordId);

			expect(response.status).toBe(404);
			expect(database.queriedTables).toEqual(new Set([patientRecordAccess]));
		});

		test("a viewer without a verified session for the link is refused", async () => {
			shareRecord();
			hasVerifiedSession.mockResolvedValue(false);

			const response = await request(recordId);

			expect(response.status).toBe(401);
			expect(hasVerifiedSession).toHaveBeenCalledWith("access-1");
			expect(database.queriedTables.size).toBe(0);
		});
	},
);

test("diagnosis details list only the related records the link also shared", async () => {
	hospitalRecords.diagnosis.mockResolvedValue({
		diagnosisId: "DIA-1",
		relatedRecords: {
			medications: [
				{ id: "MED-1", name: "Aspirin", status: "Active" },
				{ id: "MED-2", name: "Not shared", status: "Active" },
			],
			labTests: [{ id: "LAB-2", name: "Not shared", status: "Completed" }],
			imaging: [{ id: "IMG-1", name: "Chest X-ray", status: "Completed" }],
			procedures: [],
		},
	});

	const response = await getDiagnosis(new Request("http://localhost"), {
		params: Promise.resolve({ accessId: "access-1", diagnosisId: "DIA-1" }),
	});

	expect(hospitalRecords.diagnosis).toHaveBeenCalledWith("DIA-1", "hospital-1");
	expect((await response.json()).diagnosis.relatedRecords).toEqual({
		medications: [{ id: "MED-1", name: "Aspirin", status: "Active" }],
		labTests: [],
		imaging: [{ id: "IMG-1", name: "Chest X-ray", status: "Completed" }],
		procedures: [],
	});
});

test("procedure details hide a related record the link did not share", async () => {
	hospitalRecords.procedure.mockResolvedValue({
		procedureId: "PRO-1",
		relatedRecords: {
			diagnosis: { id: "DIA-2", name: "Not shared", status: "Active" },
			medication: { id: "MED-1", name: "Aspirin", status: "Active" },
		},
	});

	const response = await getProcedure(new Request("http://localhost"), {
		params: Promise.resolve({ accessId: "access-1", procedureId: "PRO-1" }),
	});

	expect((await response.json()).procedure.relatedRecords).toEqual({
		diagnosis: null,
		medication: { id: "MED-1", name: "Aspirin", status: "Active" },
	});
});
