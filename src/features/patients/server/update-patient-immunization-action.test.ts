// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { updatePatientImmunizationAction } from "./update-patient-immunization-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, database } = vi.hoisted(() => ({
	getSessionDataMock: vi.fn(),
	getOrganizationIdMock: vi.fn(),
	updateTagMock: vi.fn(),
	database: {
		immunizations: [] as Record<string, string | Date | null>[],
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
					where: () => ({ limit: async () => database.immunizations }),
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

const savedImmunization = {
	patientId: "patient-1",
	updatedAt: new Date("2026-10-14T09:00:00.000Z"),
	vaccineName: "Hepatitis B",
	seriesType: "Primary",
	currentDose: "2",
	totalDoses: "3",
	status: "Active",
	dateAdministered: new Date("2024-01-10"),
	administeredBy: "Nurse Bello",
	clinicalNote: "No reaction after the first dose.",
};

function immunizationForm(overrides: Record<string, string> = {}) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		vaccineName: "Hepatitis B",
		seriesType: "Primary",
		currentDose: "2",
		totalDoses: "3",
		status: "Active",
		dateAdministered: "2024-01-10",
		administeredBy: "Nurse Bello",
		clinicalNote: "No reaction after the first dose.",
		updatedAt: "2026-10-14T09:00:00.000Z",
		...overrides,
	}))
		formData.set(field, value);
	return formData;
}

describe("editing a patient immunization", () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date("2026-10-15T10:00:00Z"), toFake: ["Date"] });
		database.immunizations = [savedImmunization];
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
		const result = await updatePatientImmunizationAction(
			"IMM-1",
			immunizationForm({ dateAdministered: "2024-02-14", administeredBy: "Nurse Eze" }),
		);

		expect(result).toEqual({ status: "success" });
		expect(database.updates).toEqual([
			expect.objectContaining({
				vaccineName: "Hepatitis B",
				currentDose: "2",
				totalDoses: "3",
				dateAdministered: new Date("2024-02-14"),
				administeredBy: "Nurse Eze",
				updatedBy: "Ada Obi",
			}),
		]);
		expect(database.history).toEqual([
			expect.objectContaining({
				immunizationId: "IMM-1",
				fieldName: "date_administered",
				oldValue: "10th January 2024",
				newValue: "14th February 2024",
				updatedBy: "Ada Obi",
			}),
			expect.objectContaining({
				immunizationId: "IMM-1",
				fieldName: "administered_by",
				oldValue: "Nurse Bello",
				newValue: "Nurse Eze",
				updatedBy: "Ada Obi",
			}),
		]);
		expect(database.history[0].createdAt).toEqual(database.history[1].createdAt);
		expect(updateTagMock).toHaveBeenCalledTimes(2);
		expect(updateTagMock).toHaveBeenCalledWith("patient-immunizations-hospital-1-patient-1");
		expect(updateTagMock).toHaveBeenCalledWith("patient-immunization-details-hospital-1-IMM-1");
	});

	test("recording the next dose records only the current dose", async () => {
		expect(
			await updatePatientImmunizationAction("IMM-1", immunizationForm({ currentDose: "3" })),
		).toEqual({ status: "success" });
		expect(database.updates).toEqual([
			expect.objectContaining({ currentDose: "3", totalDoses: "3" }),
		]);
		expect(database.history).toEqual([
			expect.objectContaining({ fieldName: "current_dose", oldValue: "2", newValue: "3" }),
		]);
	});

	test("saving without any change writes nothing to the record or its history", async () => {
		expect(await updatePatientImmunizationAction("IMM-1", immunizationForm())).toEqual({
			status: "success",
		});
		expect(database.updates).toEqual([]);
		expect(database.history).toEqual([]);
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("rejects a current dose above the total doses without saving", async () => {
		expect(
			await updatePatientImmunizationAction(
				"IMM-1",
				immunizationForm({ currentDose: "4", totalDoses: "3" }),
			),
		).toEqual({ status: "failed", error: "The current dose can’t be more than the total doses." });
		expect(database.updates).toEqual([]);
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(await updatePatientImmunizationAction("IMM-1", immunizationForm())).toEqual({
			status: "unauthorized",
			error: "You must be signed in to edit immunizations.",
		});
		expect(database.updates).toEqual([]);
	});

	test("cannot edit an immunization that belongs to another hospital", async () => {
		database.immunizations = [];

		expect(
			await updatePatientImmunizationAction("IMM-1", immunizationForm({ currentDose: "3" })),
		).toEqual({ status: "failed", error: "Immunization could not be found." });
		expect(database.updates).toEqual([]);
	});

	test("shows a plain message and keeps the cache when the save fails", async () => {
		database.failWrites = true;
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(
			await updatePatientImmunizationAction("IMM-1", immunizationForm({ currentDose: "3" })),
		).toEqual({ status: "failed", error: "We couldn’t save these changes. Please try again." });
		expect(updateTagMock).not.toHaveBeenCalled();
	});
	test("refuses to save over changes made after the form was opened", async () => {
		const result = await updatePatientImmunizationAction(
			"IMM-1",
			immunizationForm({
				updatedAt: "2026-10-13T09:00:00.000Z",
				clinicalNote: "Changed in an old tab.",
			}),
		);

		expect(result).toEqual({
			status: "failed",
			error:
				"This immunization was changed after you opened it. Close it and open it again to see the latest version.",
		});
		expect(database.updates).toEqual([]);
		expect(database.history).toEqual([]);
	});
});
