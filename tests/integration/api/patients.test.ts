// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";

const {
	getAllergyDetailsMock,
	getDiagnosisDetailsMock,
	getDocumentDetailsMock,
	getImmunizationDetailsMock,
	getMedicationDetailsMock,
	getProcedureDetailsMock,
} = vi.hoisted(() => ({
	getAllergyDetailsMock: vi.fn(),
	getDiagnosisDetailsMock: vi.fn(),
	getDocumentDetailsMock: vi.fn(),
	getImmunizationDetailsMock: vi.fn(),
	getMedicationDetailsMock: vi.fn(),
	getProcedureDetailsMock: vi.fn(),
}));

vi.mock("@/lib/api/get-patient-allergy-details", () => ({
	getPatientAllergyDetails: getAllergyDetailsMock,
}));
vi.mock("@/lib/api/get-patient-diagnosis-details", () => ({
	getPatientDiagnosisDetails: getDiagnosisDetailsMock,
}));
vi.mock("@/lib/api/get-patient-document-details", () => ({
	getPatientDocumentDetails: getDocumentDetailsMock,
}));
vi.mock("@/lib/api/get-patient-immunization-details", () => ({
	getPatientImmunizationDetails: getImmunizationDetailsMock,
}));
vi.mock("@/lib/api/get-patient-medication-details", () => ({
	getPatientMedicationDetails: getMedicationDetailsMock,
}));
vi.mock("@/lib/api/get-patient-procedure-details", () => ({
	getPatientProcedureDetails: getProcedureDetailsMock,
}));

import { GET as getAllergyDetails } from "@/app/api/patient-allergy-details/[allergyId]/route";
import { GET as getDiagnosisDetails } from "@/app/api/patient-diagnosis-details/[diagnosisId]/route";
import { GET as getDocumentDetails } from "@/app/api/patient-document-details/[documentId]/route";
import { GET as getImmunizationDetails } from "@/app/api/patient-immunization-details/[immunizationId]/route";
import { GET as getMedicationDetails } from "@/app/api/patient-medication-details/[medicationId]/route";
import { GET as getProcedureDetails } from "@/app/api/patient-procedure-details/[procedureId]/route";

describe("Patient records API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("returns allergy details", async () => {
		const allergy = { allergyId: "allergy-1", allergen: "Penicillin" };
		getAllergyDetailsMock.mockResolvedValue(allergy);

		const response = await getAllergyDetails(
			new Request("http://localhost/api/patient-allergy-details/allergy-1"),
			{
				params: Promise.resolve({ allergyId: "allergy-1" }),
			},
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ allergy });
		expect(getAllergyDetailsMock).toHaveBeenCalledWith("allergy-1");
	});

	test("returns a 404 null allergy payload when the allergy is missing", async () => {
		getAllergyDetailsMock.mockResolvedValue(null);

		const response = await getAllergyDetails(
			new Request("http://localhost/api/patient-allergy-details/missing"),
			{
				params: Promise.resolve({ allergyId: "missing" }),
			},
		);

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ allergy: null });
	});

	test("returns diagnosis details", async () => {
		const diagnosis = { diagnosisId: "diagnosis-1", name: "Asthma" };
		getDiagnosisDetailsMock.mockResolvedValue(diagnosis);

		const response = await getDiagnosisDetails(
			new Request("http://localhost/api/patient-diagnosis-details/diagnosis-1"),
			{
				params: Promise.resolve({ diagnosisId: "diagnosis-1" }),
			},
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ diagnosis });
		expect(getDiagnosisDetailsMock).toHaveBeenCalledWith("diagnosis-1");
	});

	test("returns a 404 null diagnosis payload when the diagnosis is missing", async () => {
		getDiagnosisDetailsMock.mockResolvedValue(null);

		const response = await getDiagnosisDetails(
			new Request("http://localhost/api/patient-diagnosis-details/missing"),
			{
				params: Promise.resolve({ diagnosisId: "missing" }),
			},
		);

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ diagnosis: null });
	});

	test("returns document details", async () => {
		const document = { documentId: "document-1", title: "Discharge summary" };
		getDocumentDetailsMock.mockResolvedValue(document);

		const response = await getDocumentDetails(
			new Request("http://localhost/api/patient-document-details/document-1"),
			{
				params: Promise.resolve({ documentId: "document-1" }),
			},
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ document });
		expect(getDocumentDetailsMock).toHaveBeenCalledWith("document-1");
	});

	test("returns a 404 null document payload when the document is missing", async () => {
		getDocumentDetailsMock.mockResolvedValue(null);

		const response = await getDocumentDetails(
			new Request("http://localhost/api/patient-document-details/missing"),
			{
				params: Promise.resolve({ documentId: "missing" }),
			},
		);

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ document: null });
	});

	test("returns immunization details", async () => {
		const immunization = { immunizationId: "immunization-1", vaccineName: "Influenza" };
		getImmunizationDetailsMock.mockResolvedValue(immunization);

		const response = await getImmunizationDetails(
			new Request("http://localhost/api/patient-immunization-details/immunization-1"),
			{ params: Promise.resolve({ immunizationId: "immunization-1" }) },
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ immunization });
		expect(getImmunizationDetailsMock).toHaveBeenCalledWith("immunization-1");
	});

	test("returns a 404 null immunization payload when the immunization is missing", async () => {
		getImmunizationDetailsMock.mockResolvedValue(null);

		const response = await getImmunizationDetails(
			new Request("http://localhost/api/patient-immunization-details/missing"),
			{ params: Promise.resolve({ immunizationId: "missing" }) },
		);

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ immunization: null });
	});

	test("returns medication details", async () => {
		const medication = { medicationId: "medication-1", medication: "Aspirin" };
		getMedicationDetailsMock.mockResolvedValue(medication);

		const response = await getMedicationDetails(
			new Request("http://localhost/api/patient-medication-details/medication-1"),
			{
				params: Promise.resolve({ medicationId: "medication-1" }),
			},
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ medication });
		expect(getMedicationDetailsMock).toHaveBeenCalledWith("medication-1");
	});

	test("returns a 404 null medication payload when the medication is missing", async () => {
		getMedicationDetailsMock.mockResolvedValue(null);

		const response = await getMedicationDetails(
			new Request("http://localhost/api/patient-medication-details/missing"),
			{
				params: Promise.resolve({ medicationId: "missing" }),
			},
		);

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ medication: null });
	});

	test("returns procedure details", async () => {
		const procedure = { procedureId: "procedure-1", procedure: "Appendectomy" };
		getProcedureDetailsMock.mockResolvedValue(procedure);

		const response = await getProcedureDetails(
			new Request("http://localhost/api/patient-procedure-details/procedure-1"),
			{
				params: Promise.resolve({ procedureId: "procedure-1" }),
			},
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ procedure });
		expect(getProcedureDetailsMock).toHaveBeenCalledWith("procedure-1");
	});

	test("returns a 404 null procedure payload when the procedure is missing", async () => {
		getProcedureDetailsMock.mockResolvedValue(null);

		const response = await getProcedureDetails(
			new Request("http://localhost/api/patient-procedure-details/missing"),
			{
				params: Promise.resolve({ procedureId: "missing" }),
			},
		);

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ procedure: null });
	});
});
