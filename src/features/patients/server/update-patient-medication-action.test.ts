// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { updatePatientMedicationAction } from "./update-patient-medication-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, database } = vi.hoisted(() => ({
	getSessionDataMock: vi.fn(),
	getOrganizationIdMock: vi.fn(),
	updateTagMock: vi.fn(),
	database: {
		medications: [] as Record<string, string | Date | null>[],
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
					where: () => ({ limit: async () => database.medications }),
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

const savedMedication = {
	patientId: "patient-1",
	updatedAt: new Date("2026-10-14T09:00:00.000Z"),
	medicationName: "Salbutamol",
	indication: "Asthma",
	status: "Active",
	dose: "100 mcg",
	route: "Inhalation",
	prescribedBy: "Dr. Adeyemi",
	frequency: "Twice daily",
	duration: "3 months",
	startedAt: "2019-02-10",
	clinicalNote: "Uses a spacer.",
};

function medicationForm(overrides: Record<string, string> = {}) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		medicationName: "Salbutamol",
		indication: "Asthma",
		status: "Active",
		dose: "100 mcg",
		route: "Inhalation",
		prescribedBy: "Dr. Adeyemi",
		frequency: "Twice daily",
		duration: "3 months",
		startedAt: "2019-02-10",
		clinicalNote: "Uses a spacer.",
		updatedAt: "2026-10-14T09:00:00.000Z",
		...overrides,
	}))
		formData.set(field, value);
	return formData;
}

describe("editing a patient medication", () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date("2026-10-15T10:00:00Z"), toFake: ["Date"] });
		database.medications = [savedMedication];
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
		const result = await updatePatientMedicationAction(
			"MED-1",
			medicationForm({ prescribedBy: "Dr. Okafor", startedAt: "2019-03-01" }),
		);

		expect(result).toEqual({ status: "success" });
		expect(database.updates).toEqual([
			expect.objectContaining({
				medicationName: "Salbutamol",
				prescribedBy: "Dr. Okafor",
				startedAt: "2019-03-01",
				updatedBy: "Ada Obi",
			}),
		]);
		expect(database.history).toEqual([
			expect.objectContaining({
				medicationId: "MED-1",
				fieldName: "prescribed_by",
				oldValue: "Dr. Adeyemi",
				newValue: "Dr. Okafor",
				updatedBy: "Ada Obi",
			}),
			expect.objectContaining({
				medicationId: "MED-1",
				fieldName: "started_at",
				oldValue: "10th February 2019",
				newValue: "1st March 2019",
				updatedBy: "Ada Obi",
			}),
		]);
		expect(database.history[0].createdAt).toEqual(database.history[1].createdAt);
		expect(updateTagMock).toHaveBeenCalledTimes(2);
		expect(updateTagMock).toHaveBeenCalledWith("patient-medications-hospital-1-patient-1");
		expect(updateTagMock).toHaveBeenCalledWith("patient-medication-details-hospital-1-MED-1");
	});

	test("saving without any change writes nothing to the record or its history", async () => {
		expect(await updatePatientMedicationAction("MED-1", medicationForm())).toEqual({
			status: "success",
		});
		expect(database.updates).toEqual([]);
		expect(database.history).toEqual([]);
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("rejects a route outside the offered routes without saving", async () => {
		expect(
			await updatePatientMedicationAction("MED-1", medicationForm({ route: "Intramuscular" })),
		).toEqual({ status: "failed", error: "Select a route." });
		expect(database.updates).toEqual([]);
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(await updatePatientMedicationAction("MED-1", medicationForm())).toEqual({
			status: "unauthorized",
			error: "You must be signed in to edit medications.",
		});
		expect(database.updates).toEqual([]);
	});

	test("cannot edit a medication that belongs to another hospital", async () => {
		database.medications = [];

		expect(
			await updatePatientMedicationAction("MED-1", medicationForm({ status: "Discontinued" })),
		).toEqual({ status: "failed", error: "Medication could not be found." });
		expect(database.updates).toEqual([]);
	});

	test("shows a plain message and keeps the cache when the save fails", async () => {
		database.failWrites = true;
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(
			await updatePatientMedicationAction("MED-1", medicationForm({ status: "Discontinued" })),
		).toEqual({ status: "failed", error: "We couldn’t save these changes. Please try again." });
		expect(updateTagMock).not.toHaveBeenCalled();
	});
	test("refuses to save over changes made after the form was opened", async () => {
		const result = await updatePatientMedicationAction(
			"MED-1",
			medicationForm({
				updatedAt: "2026-10-13T09:00:00.000Z",
				clinicalNote: "Changed in an old tab.",
			}),
		);

		expect(result).toEqual({
			status: "failed",
			error:
				"This medication was changed after you opened it. Close it and open it again to see the latest version.",
		});
		expect(database.updates).toEqual([]);
		expect(database.history).toEqual([]);
	});
});
