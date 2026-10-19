// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ManualPatientType } from "../schemas/manual-patient-schema";
import { createPatientAction } from "./create-patient-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, insertedRows, transactionMock } =
	vi.hoisted(() => ({
		getSessionDataMock: vi.fn(),
		getOrganizationIdMock: vi.fn(),
		updateTagMock: vi.fn(),
		insertedRows: [] as Record<string, unknown>[],
		transactionMock: vi.fn(),
	}));

vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("next/cache", () => ({ updateTag: updateTagMock }));
vi.mock("@/lib/better-auth/auth", () => ({ db: { transaction: transactionMock } }));

function patientDetails(): ManualPatientType {
	return {
		personalInformation: {
			firstName: " Ada ",
			middleName: "",
			lastName: "Okafor",
			dateOfBirth: "1990-04-12",
			sex: "female",
			age: 35,
			maritalStatus: "married",
			nationalId: "",
		},
		contactInformation: {
			phoneNumber: "08031234567",
			emailAddress: "Ada@Example.com",
			residentialAddress: "",
			stateOfOrigin: "Anambra",
			countryOfOrigin: "Nigeria",
		},
		emergencyContact: {
			firstName: "Chidi",
			middleName: "",
			lastName: "Okafor",
			relationship: "Husband",
			phoneNumber: "08037654321",
		},
		physicalInformation: { height: "165", weight: "60", bloodGroup: "O+", genotype: "AA" },
	};
}

describe("adding a patient manually", () => {
	beforeEach(() => {
		insertedRows.length = 0;
		getSessionDataMock.mockResolvedValue({ user: { id: "member-1", emailVerified: true } });
		getOrganizationIdMock.mockResolvedValue("hospital-1");
		transactionMock.mockImplementation(async (save) =>
			save({
				insert: () => ({
					values: async (row: Record<string, unknown>) => {
						insertedRows.push(row);
					},
				}),
			}),
		);
	});

	test("creates the patient for the session's hospital and refreshes the patient views", async () => {
		const result = await createPatientAction(patientDetails());

		expect(result).toEqual({ status: "success", patientId: expect.any(String) });
		const patientId = result.status === "success" ? result.patientId : "";
		expect(insertedRows[0]).toEqual({ id: patientId, organizationId: "hospital-1" });
		expect(insertedRows).toContainEqual(
			expect.objectContaining({ patientId, firstName: "Ada", middleName: null, sex: "female" }),
		);
		expect(insertedRows).toContainEqual(
			expect.objectContaining({ patientId, emailAddress: "ada@example.com" }),
		);
		expect(insertedRows).toContainEqual(
			expect.objectContaining({ patientId, firstName: "Chidi", phoneNumber: "08037654321" }),
		);
		expect(insertedRows).toContainEqual(expect.objectContaining({ patientId, genotype: "AA" }));
		for (const tag of [
			"patients-list-hospital-1",
			"recent-patients-hospital-1",
			"overview-stats-hospital-1",
			`patient-profile-hospital-1-${patientId}`,
			`patient-by-id-hospital-1-${patientId}`,
		]) {
			expect(updateTagMock).toHaveBeenCalledWith(tag);
		}
	});

	test.each([
		{
			missing: "a first name",
			edit: (details: ManualPatientType) => (details.personalInformation.firstName = " "),
			error: "First name is required.",
		},
		{
			missing: "a date of birth",
			edit: (details: ManualPatientType) => (details.personalInformation.dateOfBirth = ""),
			error: "Date of birth is required.",
		},
		{
			missing: "a valid email address",
			edit: (details: ManualPatientType) => (details.contactInformation.emailAddress = "ada"),
			error: "Enter a valid email address.",
		},
		{
			missing: "an emergency contact last name",
			edit: (details: ManualPatientType) => (details.emergencyContact.lastName = ""),
			error: "Last name is required.",
		},
	])("refuses a patient without $missing and saves nothing", async ({ edit, error }) => {
		const details = patientDetails();
		edit(details);

		expect(await createPatientAction(details)).toEqual({ status: "failed", error });
		expect(transactionMock).not.toHaveBeenCalled();
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("asks a signed-out user to sign in and saves nothing", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(await createPatientAction(patientDetails())).toEqual({
			status: "unauthorized",
			error: "You must be signed in to add patients.",
		});
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test("refuses a member whose hospital is not verified and saves nothing", async () => {
		getOrganizationIdMock.mockResolvedValue(null);

		expect(await createPatientAction(patientDetails())).toEqual({
			status: "failed",
			error: "Your hospital must be verified before you can add patients.",
		});
		expect(transactionMock).not.toHaveBeenCalled();
	});

	test("returns a plain message instead of the database error when saving fails", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		transactionMock.mockRejectedValue(new Error("duplicate key value violates constraint"));

		expect(await createPatientAction(patientDetails())).toEqual({
			status: "failed",
			error: "We couldn’t save this patient. Please try again.",
		});
		expect(updateTagMock).not.toHaveBeenCalled();
	});
});
