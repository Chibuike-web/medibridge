// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import type { NextRequest } from "next/server";

const {
	getPatientsMock,
	getTransferDetailsMock,
	verifySessionMock,
	getAllergiesMock,
	getDiagnosesMock,
	getImmunizationsMock,
	getProceduresMock,
	getMedicationsMock,
	getLabTestsMock,
	getImagingMock,
} = vi.hoisted(() => ({
	getPatientsMock: vi.fn(),
	getTransferDetailsMock: vi.fn(),
	verifySessionMock: vi.fn(),
	getAllergiesMock: vi.fn(),
	getDiagnosesMock: vi.fn(),
	getImmunizationsMock: vi.fn(),
	getProceduresMock: vi.fn(),
	getMedicationsMock: vi.fn(),
	getLabTestsMock: vi.fn(),
	getImagingMock: vi.fn(),
}));

vi.mock("@/lib/api/get-patients", () => ({ getPatients: getPatientsMock }));
vi.mock("@/lib/api/get-transfer-details", () => ({ getTransferDetails: getTransferDetailsMock }));
vi.mock("@/lib/api/verify-session", () => ({ verifySession: verifySessionMock }));
vi.mock("@/lib/api/get-patient-allergies", () => ({ getPatientAllergies: getAllergiesMock }));
vi.mock("@/lib/api/get-patient-diagnoses", () => ({ getPatientDiagnoses: getDiagnosesMock }));
vi.mock("@/lib/api/get-patient-immunizations", () => ({ getPatientImmunizations: getImmunizationsMock }));
vi.mock("@/lib/api/get-patient-procedures", () => ({ getPatientProcedures: getProceduresMock }));
vi.mock("@/lib/api/get-patient-medications", () => ({ getPatientMedications: getMedicationsMock }));
vi.mock("@/lib/api/get-patient-lab-tests", () => ({ getPatientLabTests: getLabTestsMock }));
vi.mock("@/lib/api/get-patient-imaging", () => ({ getPatientImaging: getImagingMock }));

import { GET as getClinicalRecordOptions } from "@/app/api/transfer-clinical-record-options/route";
import { GET as getTransferDetails } from "@/app/api/transfer-details/[transferId]/route";
import { GET as getPatientOptions } from "@/app/api/transfer-patient-options/route";

function nextRequest(url: string) {
	return { nextUrl: new URL(url) } as unknown as NextRequest;
}

describe("Transfers API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		verifySessionMock.mockResolvedValue({ user: { id: "user-1" } });
	});

	describe("GET /api/transfer-details/:transferId", () => {
		test("returns transfer details for an authenticated request", async () => {
			const transfer = { transferId: "transfer-1", status: "pending" };
			getTransferDetailsMock.mockResolvedValue(transfer);

			const response = await getTransferDetails(new Request("http://localhost/api/transfer-details/transfer-1"), {
				params: Promise.resolve({ transferId: "transfer-1" }),
			});

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ transfer });
			expect(verifySessionMock).toHaveBeenCalledOnce();
			expect(getTransferDetailsMock).toHaveBeenCalledWith("transfer-1");
		});

		test("returns a 404 null transfer payload when the transfer is missing", async () => {
			getTransferDetailsMock.mockResolvedValue(null);

			const response = await getTransferDetails(new Request("http://localhost/api/transfer-details/missing"), {
				params: Promise.resolve({ transferId: "missing" }),
			});

			expect(response.status).toBe(404);
			expect(await response.json()).toEqual({ transfer: null });
		});

		test("does not query transfer details when session verification fails", async () => {
			verifySessionMock.mockRejectedValue(new Error("Unauthorized"));

			await expect(
				getTransferDetails(new Request("http://localhost/api/transfer-details/transfer-1"), {
					params: Promise.resolve({ transferId: "transfer-1" }),
				}),
			).rejects.toThrow("Unauthorized");
			expect(getTransferDetailsMock).not.toHaveBeenCalled();
		});
	});

	describe("GET /api/transfer-patient-options", () => {
		test("returns paginated patients using default pagination", async () => {
			const patients = [{ patientId: "patient-1", name: "Ada Lovelace" }];
			getPatientsMock.mockResolvedValue({ patients, totalPatients: 45 });

			const response = await getPatientOptions(nextRequest("http://localhost/api/transfer-patient-options"));

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ patients, page: 1, totalPages: 3 });
			expect(getPatientsMock).toHaveBeenCalledWith(1, 20);
		});

		test("normalizes invalid pagination values to defaults", async () => {
			getPatientsMock.mockResolvedValue({ patients: [], totalPatients: 0 });

			await getPatientOptions(
				nextRequest("http://localhost/api/transfer-patient-options?page=0&limit=not-a-number"),
			);

			expect(getPatientsMock).toHaveBeenCalledWith(1, 20);
		});

		test("uses valid page and limit values", async () => {
			getPatientsMock.mockResolvedValue({ patients: [], totalPatients: 0 });

			const response = await getPatientOptions(
				nextRequest("http://localhost/api/transfer-patient-options?page=2&limit=5"),
			);

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ patients: [], page: 2, totalPages: 1 });
			expect(getPatientsMock).toHaveBeenCalledWith(2, 5);
		});
	});

	describe("GET /api/transfer-clinical-record-options", () => {
		test("returns 400 when patientId is missing", async () => {
			const response = await getClinicalRecordOptions(
				nextRequest("http://localhost/api/transfer-clinical-record-options?type=diagnoses"),
			);

			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ error: "Missing patient ID." });
		});

		test("returns 400 when the clinical record type is invalid", async () => {
			const response = await getClinicalRecordOptions(
				nextRequest("http://localhost/api/transfer-clinical-record-options?patientId=patient-1&type=invalid"),
			);

			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ error: "Invalid clinical record type." });
		});

	test("maps diagnosis records into transfer options", async () => {
			getDiagnosesMock.mockResolvedValue({
				diagnoses: [{ diagnosisId: "diagnosis-1", name: "Asthma", createdAtLabel: "Jan 10, 2026" }],
				totalDiagnoses: 1,
			});

			const response = await getClinicalRecordOptions(
				nextRequest(
					"http://localhost/api/transfer-clinical-record-options?patientId=patient-1&type=diagnoses&page=2&limit=3&query=as",
				),
			);

			expect(await response.json()).toEqual({
				records: [{ id: "diagnosis-1", name: "Asthma", type: "diagnoses", createdAt: "Jan 10, 2026" }],
				page: 2,
				totalRecords: 1,
				totalPages: 1,
			});
			expect(getDiagnosesMock).toHaveBeenCalledWith("patient-1", 2, 3, "as");
		});

		test("maps each remaining clinical record type into transfer options", async () => {
			getAllergiesMock.mockResolvedValue({ allergies: [{ allergyId: "a1", allergen: "Penicillin", createdAtLabel: "Jan" }], totalAllergies: 1 });
			getImmunizationsMock.mockResolvedValue({ immunizations: [{ immunizationId: "i1", vaccineName: "Flu", createdAtLabel: "Jan" }], totalImmunizations: 1 });
			getProceduresMock.mockResolvedValue({ procedures: [{ procedureId: "p1", procedure: "Appendectomy", createdAtLabel: "Jan" }], totalProcedures: 1 });
			getMedicationsMock.mockResolvedValue({ medications: [{ medicationId: "m1", medication: "Aspirin", createdAtLabel: "Jan" }], totalMedications: 1 });
			getLabTestsMock.mockResolvedValue({ labTests: [{ labId: "l1", test: "CBC", createdAtLabel: "Jan" }], totalLabTests: 1 });
			getImagingMock.mockResolvedValue({ imagingStudies: [{ imagingId: "x1", study: "CT scan", createdAtLabel: "Jan" }], totalImagingStudies: 1 });

			const expected = [
				["allergies", { id: "a1", name: "Penicillin", type: "allergies" }],
				["immunizations", { id: "i1", name: "Flu", type: "immunizations" }],
				["procedures", { id: "p1", name: "Appendectomy", type: "procedures" }],
				["medications", { id: "m1", name: "Aspirin", type: "medications" }],
				["lab-tests", { id: "l1", name: "CBC", type: "lab-tests" }],
				["imaging", { id: "x1", name: "CT scan", type: "imaging" }],
			] as const;

			for (const [type, record] of expected) {
				const response = await getClinicalRecordOptions(
					nextRequest(`http://localhost/api/transfer-clinical-record-options?patientId=patient-1&type=${type}`),
				);
				expect(await response.json()).toMatchObject({ records: [record], totalRecords: 1 });
			}
		});

		test("caps the clinical-record limit at 50", async () => {
			getAllergiesMock.mockResolvedValue({ allergies: [], totalAllergies: 0 });

			await getClinicalRecordOptions(
				nextRequest("http://localhost/api/transfer-clinical-record-options?patientId=patient-1&type=allergies&limit=999"),
			);

			expect(getAllergiesMock).toHaveBeenCalledWith("patient-1", 1, 50, "");
		});
	});
});
