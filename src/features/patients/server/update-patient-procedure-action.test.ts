// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { updatePatientProcedureAction } from "./update-patient-procedure-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, database } = vi.hoisted(() => ({
	getSessionDataMock: vi.fn(),
	getOrganizationIdMock: vi.fn(),
	updateTagMock: vi.fn(),
	database: {
		procedures: [] as Record<string, string | Date | null>[],
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
					where: () => ({ limit: async () => database.procedures }),
				}),
			}),
		}),
		transaction: async (
			write: (tx: {
				update: () => { set: (values: Record<string, unknown>) => { where: () => void } };
				insert: () => { values: (rows: Record<string, unknown>[]) => void };
			}) => Promise<void>,
		) => {
			if (database.failWrites) throw new Error("connection lost");

			await write({
				update: () => ({
					set: (values) => ({
						where: () => {
							database.updates.push(values);
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

const completedProcedure = {
	patientId: "patient-1",
	updatedAt: new Date("2026-10-14T09:00:00.000Z"),
	procedureName: "Knee arthroscopy",
	indication: "Torn meniscus",
	status: "Completed",
	procedureDate: new Date("2026-09-14"),
	performedBy: "Dr. Okafor",
	assistants: "Nurse Bello",
	facility: "Theatre 2",
	plannedDate: new Date("2026-09-07"),
	plannedPhysician: "Dr. Adeyemi",
	plannedAssistants: "Nurse Bello",
	plannedFacility: "Theatre 1",
	clinicalNote: "Left knee.",
};

const pendingProcedure = {
	patientId: "patient-1",
	updatedAt: new Date("2026-10-14T09:00:00.000Z"),
	procedureName: "Knee arthroscopy",
	indication: "Torn meniscus",
	status: "Pending",
	procedureDate: null,
	performedBy: null,
	assistants: null,
	facility: null,
	plannedDate: new Date("2026-10-12"),
	plannedPhysician: "Dr. Adeyemi",
	plannedAssistants: "Nurse Bello",
	plannedFacility: "Theatre 2",
	clinicalNote: "Left knee.",
};

function procedureForm(overrides: Record<string, string> = {}) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		procedureName: "Knee arthroscopy",
		indication: "Torn meniscus",
		status: "Completed",
		procedureDate: "2026-09-14",
		physician: "Dr. Okafor",
		assistants: "Nurse Bello",
		facility: "Theatre 2",
		clinicalNote: "Left knee.",
		updatedAt: "2026-10-14T09:00:00.000Z",
		...overrides,
	}))
		formData.set(field, value);
	return formData;
}

describe("editing a patient procedure", () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date("2026-10-15T10:00:00Z"), toFake: ["Date"] });
		database.procedures = [completedProcedure];
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
		const result = await updatePatientProcedureAction(
			"PRO-1",
			procedureForm({ procedureName: "Left knee arthroscopy", procedureDate: "2026-09-15" }),
		);

		expect(result).toEqual({ status: "success" });
		expect(database.updates).toEqual([
			expect.objectContaining({
				procedureName: "Left knee arthroscopy",
				procedureDate: new Date("2026-09-15"),
				performedBy: "Dr. Okafor",
				updatedBy: "Ada Obi",
			}),
		]);
		expect(database.history).toEqual([
			expect.objectContaining({
				procedureId: "PRO-1",
				fieldName: "procedure_name",
				oldValue: "Knee arthroscopy",
				newValue: "Left knee arthroscopy",
				updatedBy: "Ada Obi",
			}),
			expect.objectContaining({
				procedureId: "PRO-1",
				fieldName: "procedure_date",
				oldValue: "14th September 2026",
				newValue: "15th September 2026",
				updatedBy: "Ada Obi",
			}),
		]);
		expect(database.history[0].createdAt).toEqual(database.history[1].createdAt);
		expect(updateTagMock).toHaveBeenCalledTimes(2);
		expect(updateTagMock).toHaveBeenCalledWith("patient-procedures-hospital-1-patient-1");
		expect(updateTagMock).toHaveBeenCalledWith("patient-procedure-details-hospital-1-PRO-1");
	});

	test("editing a planned procedure updates the plan and leaves the performed details untouched", async () => {
		database.procedures = [pendingProcedure];

		expect(
			await updatePatientProcedureAction(
				"PRO-1",
				procedureForm({ status: "Pending", procedureDate: "2026-11-09", physician: "Dr. Eze" }),
			),
		).toEqual({ status: "success" });
		expect(database.updates).toEqual([
			expect.objectContaining({
				status: "Pending",
				plannedDate: new Date("2026-11-09"),
				plannedPhysician: "Dr. Eze",
				plannedAssistants: "Nurse Bello",
				plannedFacility: "Theatre 2",
				updatedBy: "Ada Obi",
			}),
		]);
		for (const performedColumn of ["procedureDate", "performedBy", "assistants", "facility"])
			expect(database.updates[0]).not.toHaveProperty(performedColumn);
		expect(database.history).toEqual([
			expect.objectContaining({
				fieldName: "procedure_date",
				oldValue: "12th October 2026",
				newValue: "9th November 2026",
			}),
			expect.objectContaining({
				fieldName: "physician",
				oldValue: "Dr. Adeyemi",
				newValue: "Dr. Eze",
			}),
		]);
	});

	test("completing a planned procedure saves when, by whom and where it was performed, and records the status change", async () => {
		database.procedures = [pendingProcedure];

		expect(
			await updatePatientProcedureAction(
				"PRO-1",
				procedureForm({ procedureDate: "2026-10-12", physician: "Dr. Adeyemi" }),
			),
		).toEqual({ status: "success" });
		expect(database.updates).toEqual([
			expect.objectContaining({
				status: "Completed",
				procedureDate: new Date("2026-10-12"),
				performedBy: "Dr. Adeyemi",
				assistants: "Nurse Bello",
				facility: "Theatre 2",
				updatedBy: "Ada Obi",
			}),
		]);
		expect(database.history).toEqual([
			expect.objectContaining({
				procedureId: "PRO-1",
				fieldName: "status",
				oldValue: "Pending",
				newValue: "Completed",
				updatedBy: "Ada Obi",
			}),
		]);
	});

	test("saving without any change writes nothing to the record or its history", async () => {
		expect(await updatePatientProcedureAction("PRO-1", procedureForm())).toEqual({
			status: "success",
		});
		expect(database.updates).toEqual([]);
		expect(database.history).toEqual([]);
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("rejects a completed procedure dated in the future without saving", async () => {
		expect(
			await updatePatientProcedureAction("PRO-1", procedureForm({ procedureDate: "2026-10-20" })),
		).toEqual({ status: "failed", error: "A completed procedure can’t be dated in the future." });
		expect(database.updates).toEqual([]);
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(await updatePatientProcedureAction("PRO-1", procedureForm())).toEqual({
			status: "unauthorized",
			error: "You must be signed in to edit procedures.",
		});
		expect(database.updates).toEqual([]);
	});

	test("cannot edit a procedure that belongs to another hospital", async () => {
		database.procedures = [];

		expect(
			await updatePatientProcedureAction(
				"PRO-1",
				procedureForm({ procedureName: "Left knee arthroscopy" }),
			),
		).toEqual({ status: "failed", error: "Procedure could not be found." });
		expect(database.updates).toEqual([]);
	});

	test("shows a plain message and keeps the cache when the save fails", async () => {
		database.failWrites = true;
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(
			await updatePatientProcedureAction(
				"PRO-1",
				procedureForm({ procedureName: "Left knee arthroscopy" }),
			),
		).toEqual({ status: "failed", error: "We couldn’t save these changes. Please try again." });
		expect(updateTagMock).not.toHaveBeenCalled();
	});
	test("refuses to save over changes made after the form was opened", async () => {
		const result = await updatePatientProcedureAction(
			"PRO-1",
			procedureForm({
				updatedAt: "2026-10-13T09:00:00.000Z",
				clinicalNote: "Changed in an old tab.",
			}),
		);

		expect(result).toEqual({
			status: "failed",
			error:
				"This procedure was changed after you opened it. Close it and open it again to see the latest version.",
		});
		expect(database.updates).toEqual([]);
		expect(database.history).toEqual([]);
	});
});
