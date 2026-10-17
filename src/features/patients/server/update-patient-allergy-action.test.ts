// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { updatePatientAllergyAction } from "./update-patient-allergy-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, database } = vi.hoisted(() => ({
	getSessionDataMock: vi.fn(),
	getOrganizationIdMock: vi.fn(),
	updateTagMock: vi.fn(),
	database: {
		allergies: [] as Record<string, string | Date | null>[],
		updates: [] as Record<string, unknown>[],
		history: [] as Record<string, unknown>[],
		failWrites: false,
	},
}));

vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("next/cache", () => ({ updateTag: updateTagMock }));
vi.mock("@/lib/better-auth/auth", () => ({
	db: {
		select: () => ({
			from: () => ({
				innerJoin: () => ({
					where: () => ({ limit: async () => database.allergies }),
				}),
			}),
		}),
		transaction: async (
			write: (tx: {
				update: () => {
					set: (values: Record<string, unknown>) => {
						where: () => { returning: () => Promise<{ id: string }[]> };
					};
				};
				insert: () => { values: (rows: Record<string, unknown>[]) => void };
			}) => Promise<void>,
		) => {
			if (database.failWrites) throw new Error("connection lost");

			await write({
				update: () => ({
					set: (values) => ({
						where: () => {
							database.updates.push(values);
							return { returning: async () => [{ id: "saved-record" }] };
						},
					}),
				}),
				insert: () => ({
					values: (rows) => {
						database.history.push(...rows);
					},
				}),
			});
		},
	},
}));

const savedAllergy = {
	patientId: "patient-1",
	updatedAt: new Date("2026-10-14T09:00:00.000Z"),
	allergen: "Penicillin",
	severity: "Moderate",
	status: "Active",
	reaction: "Hives across the chest.",
	clinicalNote: "Carries an antihistamine.",
};

function allergyForm(overrides: Record<string, string> = {}) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		allergen: "Penicillin",
		severity: "Moderate",
		status: "Active",
		reaction: "Hives across the chest.",
		clinicalNote: "Carries an antihistamine.",
		updatedAt: "2026-10-14T09:00:00.000Z",
		...overrides,
	}))
		formData.set(field, value);
	return formData;
}

describe("editing a patient allergy", () => {
	beforeEach(() => {
		database.allergies = [savedAllergy];
		database.updates = [];
		database.history = [];
		database.failWrites = false;
		updateTagMock.mockClear();
		getSessionDataMock.mockResolvedValue({
			user: { id: "member-1", name: "Ada Obi", emailVerified: true },
		});
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	test("saves the changes and records each changed field once, with its old and new value", async () => {
		const result = await updatePatientAllergyAction(
			"ALL-1",
			allergyForm({ severity: "Severe", clinicalNote: "Avoid all beta-lactams." }),
		);

		expect(result).toEqual({ status: "success" });
		expect(database.updates).toEqual([
			expect.objectContaining({
				allergen: "Penicillin",
				severity: "Severe",
				clinicalNote: "Avoid all beta-lactams.",
				updatedBy: "Ada Obi",
			}),
		]);
		expect(database.history).toEqual([
			expect.objectContaining({
				allergyId: "ALL-1",
				fieldName: "severity",
				oldValue: "Moderate",
				newValue: "Severe",
				updatedBy: "Ada Obi",
			}),
			expect.objectContaining({
				allergyId: "ALL-1",
				fieldName: "clinical_note",
				oldValue: "Carries an antihistamine.",
				newValue: "Avoid all beta-lactams.",
				updatedBy: "Ada Obi",
			}),
		]);
		expect(database.history[0].createdAt).toEqual(database.history[1].createdAt);
		expect(updateTagMock).toHaveBeenCalledTimes(3);
		expect(updateTagMock).toHaveBeenCalledWith("patient-allergies-hospital-1-patient-1");
		expect(updateTagMock).toHaveBeenCalledWith("patient-allergy-details-hospital-1-ALL-1");
		expect(updateTagMock).toHaveBeenCalledWith("patient-profile-hospital-1-patient-1");
	});

	test("saving without any change writes nothing to the record or its history", async () => {
		expect(await updatePatientAllergyAction("ALL-1", allergyForm())).toEqual({
			status: "success",
		});
		expect(database.updates).toEqual([]);
		expect(database.history).toEqual([]);
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("rejects invalid changes without saving", async () => {
		expect(await updatePatientAllergyAction("ALL-1", allergyForm({ reaction: " " }))).toEqual({
			status: "failed",
			error: "Describe the reaction.",
		});
		expect(database.updates).toEqual([]);
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(await updatePatientAllergyAction("ALL-1", allergyForm())).toEqual({
			status: "unauthorized",
			error: "You must be signed in to edit allergies.",
		});
		expect(database.updates).toEqual([]);
	});

	test("cannot edit an allergy that belongs to another hospital", async () => {
		database.allergies = [];

		expect(await updatePatientAllergyAction("ALL-1", allergyForm({ severity: "Severe" }))).toEqual({
			status: "failed",
			error: "Allergy could not be found.",
		});
		expect(database.updates).toEqual([]);
	});

	test("shows a plain message and keeps the cache when the save fails", async () => {
		database.failWrites = true;
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(await updatePatientAllergyAction("ALL-1", allergyForm({ severity: "Severe" }))).toEqual({
			status: "failed",
			error: "We couldn’t save these changes. Please try again.",
		});
		expect(updateTagMock).not.toHaveBeenCalled();
	});
	test("refuses to save over changes made after the form was opened", async () => {
		const result = await updatePatientAllergyAction(
			"ALL-1",
			allergyForm({
				updatedAt: "2026-10-13T09:00:00.000Z",
				clinicalNote: "Changed in an old tab.",
			}),
		);

		expect(result).toEqual({
			status: "failed",
			error:
				"This allergy was changed after you opened it. Close it and open it again to see the latest version.",
		});
		expect(database.updates).toEqual([]);
		expect(database.history).toEqual([]);
	});
});
