// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { updatePatientEncounterAction } from "./update-patient-encounter-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, database } = vi.hoisted(() => ({
	getSessionDataMock: vi.fn(),
	getOrganizationIdMock: vi.fn(),
	updateTagMock: vi.fn(),
	database: {
		encounters: [] as Record<string, string | Date | null>[],
		updates: [] as Record<string, unknown>[],
		changedSinceRead: false,
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
					where: () => ({ limit: async () => database.encounters }),
				}),
			}),
		}),
		update: () => ({
			set: (values: Record<string, unknown>) => ({
				where: () => ({
					returning: async () => {
						if (database.failWrites) throw new Error("connection lost");
						if (database.changedSinceRead) return [];
						database.updates.push(values);
						return [{ id: "ENC-1" }];
					},
				}),
			}),
		}),
	},
}));

const savedEncounter = {
	patientId: "patient-1",
	updatedAt: new Date("2026-10-14T09:00:00.000Z"),
	encounterType: "Outpatient Visit",
	department: "General Medicine",
	physician: "Dr. Adeyemi",
	encounterDate: new Date("2026-10-14T08:45:00.000Z"),
	reason: "Chest pain for 2 days",
};

function encounterForm(overrides: Record<string, string> = {}) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		encounterType: "Outpatient Visit",
		department: "General Medicine",
		physician: "Dr. Adeyemi",
		encounterDate: "2026-10-14T08:45:00.000Z",
		reason: "Chest pain for 2 days",
		updatedAt: "2026-10-14T09:00:00.000Z",
		...overrides,
	}))
		formData.set(field, value);
	return formData;
}

describe("editing a patient encounter", () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date("2026-10-15T10:00:00Z"), toFake: ["Date"] });
		database.encounters = [savedEncounter];
		database.updates = [];
		database.changedSinceRead = false;
		database.failWrites = false;
		updateTagMock.mockClear();
		getSessionDataMock.mockResolvedValue({
			user: { id: "member-1", name: "Ada Obi", emailVerified: true },
		});
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	test("saves the changed details and refreshes the encounter everywhere it shows", async () => {
		const result = await updatePatientEncounterAction(
			"ENC-1",
			encounterForm({
				encounterType: "Follow-up Visit",
				encounterDate: "2026-10-13T08:45:00.000Z",
				reason: " ",
			}),
		);

		expect(result).toEqual({ status: "success" });
		expect(database.updates).toEqual([
			expect.objectContaining({
				encounterType: "Follow-up Visit",
				department: "General Medicine",
				physician: "Dr. Adeyemi",
				encounterDate: new Date("2026-10-13T08:45:00.000Z"),
				reason: null,
				updatedBy: "Ada Obi",
			}),
		]);
		expect(updateTagMock).toHaveBeenCalledWith("patient-encounter-hospital-1-patient-1-ENC-1");
		expect(updateTagMock).toHaveBeenCalledWith("patient-encounters-hospital-1-patient-1");
		expect(updateTagMock).toHaveBeenCalledWith("patient-vitals-hospital-1-patient-1");
	});

	test("saving without any change writes nothing", async () => {
		expect(await updatePatientEncounterAction("ENC-1", encounterForm())).toEqual({
			status: "success",
		});
		expect(database.updates).toEqual([]);
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("rejects invalid changes without saving", async () => {
		expect(
			await updatePatientEncounterAction("ENC-1", encounterForm({ physician: " " })),
		).toEqual({ status: "failed", error: "Enter the physician." });
		expect(database.updates).toEqual([]);
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(await updatePatientEncounterAction("ENC-1", encounterForm())).toEqual({
			status: "unauthorized",
			error: "You must be signed in to edit encounters.",
		});
		expect(database.updates).toEqual([]);
	});

	test("cannot edit an encounter that belongs to another hospital", async () => {
		database.encounters = [];

		expect(
			await updatePatientEncounterAction("ENC-1", encounterForm({ department: "Cardiology" })),
		).toEqual({ status: "failed", error: "Encounter could not be found." });
		expect(database.updates).toEqual([]);
	});

	test("shows a plain message and keeps the cache when the save fails", async () => {
		database.failWrites = true;
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(
			await updatePatientEncounterAction("ENC-1", encounterForm({ department: "Cardiology" })),
		).toEqual({ status: "failed", error: "We couldn’t save these changes. Please try again." });
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("refuses to save over changes made after the form was opened", async () => {
		const result = await updatePatientEncounterAction(
			"ENC-1",
			encounterForm({ updatedAt: "2026-10-13T09:00:00.000Z", physician: "Dr. Okafor" }),
		);

		expect(result).toEqual({
			status: "failed",
			error:
				"This encounter was changed after you opened it. Close it and open it again to see the latest version.",
		});
		expect(database.updates).toEqual([]);
	});

	test("refuses to save when another save lands between reading and writing", async () => {
		database.changedSinceRead = true;

		const result = await updatePatientEncounterAction(
			"ENC-1",
			encounterForm({ physician: "Dr. Okafor" }),
		);

		expect(result).toEqual({
			status: "failed",
			error:
				"This encounter was changed after you opened it. Close it and open it again to see the latest version.",
		});
		expect(updateTagMock).not.toHaveBeenCalled();
	});
});
