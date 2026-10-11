// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";

const {
	getAllergyDetailsMock,
	getDiagnosisDetailsMock,
	getImmunizationDetailsMock,
	getMedicationDetailsMock,
	getProcedureDetailsMock,
	getSessionDataMock,
	getOrganizationIdMock,
} = vi.hoisted(() => ({
	getAllergyDetailsMock: vi.fn(),
	getDiagnosisDetailsMock: vi.fn(),
	getImmunizationDetailsMock: vi.fn(),
	getMedicationDetailsMock: vi.fn(),
	getProcedureDetailsMock: vi.fn(),
	getSessionDataMock: vi.fn(),
	getOrganizationIdMock: vi.fn(),
}));

vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));

vi.mock("@/lib/api/get-patient-allergy-details", () => ({
	getPatientAllergyDetails: getAllergyDetailsMock,
}));
vi.mock("@/lib/api/get-patient-diagnosis-details", () => ({
	getPatientDiagnosisDetails: getDiagnosisDetailsMock,
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
import { GET as getImmunizationDetails } from "@/app/api/patient-immunization-details/[immunizationId]/route";
import { GET as getMedicationDetails } from "@/app/api/patient-medication-details/[medicationId]/route";
import { GET as getProcedureDetails } from "@/app/api/patient-procedure-details/[procedureId]/route";

describe("Patient records API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionDataMock.mockResolvedValue({ user: { id: "user-1", emailVerified: true } });
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	describe.each([
		{
			name: "allergy",
			readRecord: getAllergyDetailsMock,
			invoke: () =>
				getAllergyDetails(new Request("http://localhost/api/patient-allergy-details/allergy-1"), {
					params: Promise.resolve({ allergyId: "allergy-1" }),
				}),
		},
		{
			name: "diagnosis",
			readRecord: getDiagnosisDetailsMock,
			invoke: () =>
				getDiagnosisDetails(
					new Request("http://localhost/api/patient-diagnosis-details/diagnosis-1"),
					{ params: Promise.resolve({ diagnosisId: "diagnosis-1" }) },
				),
		},
		{
			name: "immunization",
			readRecord: getImmunizationDetailsMock,
			invoke: () =>
				getImmunizationDetails(
					new Request("http://localhost/api/patient-immunization-details/immunization-1"),
					{ params: Promise.resolve({ immunizationId: "immunization-1" }) },
				),
		},
		{
			name: "medication",
			readRecord: getMedicationDetailsMock,
			invoke: () =>
				getMedicationDetails(
					new Request("http://localhost/api/patient-medication-details/medication-1"),
					{ params: Promise.resolve({ medicationId: "medication-1" }) },
				),
		},
		{
			name: "procedure",
			readRecord: getProcedureDetailsMock,
			invoke: () =>
				getProcedureDetails(
					new Request("http://localhost/api/patient-procedure-details/procedure-1"),
					{ params: Promise.resolve({ procedureId: "procedure-1" }) },
				),
		},
	])("$name access", ({ invoke, readRecord }) => {
		test.each([
			{ scenario: "signed out", session: null, status: 401 },
			{ scenario: "without a user ID", session: { user: { emailVerified: true } }, status: 401 },
			{
				scenario: "with an unverified email",
				session: { user: { id: "user-1", emailVerified: false } },
				status: 403,
			},
			{
				scenario: "with missing email verification",
				session: { user: { id: "user-1" } },
				status: 403,
			},
		])(
			"returns an access error $scenario without patient data or a redirect",
			async ({ session, status }) => {
				getSessionDataMock.mockResolvedValue(session);
				const response = await invoke();
				expect(response.status).toBe(status);
				expect(await response.json()).toEqual({
					status: "failed",
					error: expect.stringMatching(status === 401 ? /^Sign in/ : /^Verify your email/),
				});
				expect(response.headers.has("location")).toBe(false);
				expect(readRecord).not.toHaveBeenCalled();
			},
		);

		test("returns a hospital access error when the email is verified but hospital access is unavailable", async () => {
			getOrganizationIdMock.mockResolvedValue(null);
			const response = await invoke();
			expect(response.status).toBe(403);
			expect(await response.json()).toEqual({
				status: "failed",
				error: expect.stringMatching(/^Your hospital must be verified/),
			});
			expect(readRecord).not.toHaveBeenCalled();
		});
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
