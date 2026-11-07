// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { markPatientProcedureCompletedAction } from "./mark-patient-procedure-completed-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, database } = vi.hoisted(() => ({
	getSessionDataMock: vi.fn(),
	getOrganizationIdMock: vi.fn(),
	updateTagMock: vi.fn(),
	database: {
		procedures: [] as Record<string, string | Date>[],
		updates: [] as Record<string, unknown>[],
		history: [] as Record<string, unknown>[],
		changedBeforeSaving: false,
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
							if (database.changedBeforeSaving) return { returning: async () => [] };
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

const openedUpdatedAt = "2026-10-14T09:00:00.000Z";

describe("marking a patient procedure as completed", () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date("2026-10-15T10:00:00Z"), toFake: ["Date"] });
		database.procedures = [
			{
				patientId: "patient-1",
				status: "Pending",
				procedureDate: new Date("2026-10-15T00:00:00Z"),
				updatedAt: new Date(openedUpdatedAt),
			},
		];
		database.updates = [];
		database.history = [];
		database.changedBeforeSaving = false;
		database.failWrites = false;
		updateTagMock.mockClear();
		getSessionDataMock.mockResolvedValue({
			user: { id: "member-1", name: "Ada Obi", emailVerified: true },
		});
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	test("saves Completed, records the change in Activity and refreshes the procedure", async () => {
		expect(await markPatientProcedureCompletedAction("PRO-1", openedUpdatedAt)).toEqual({
			status: "success",
		});
		expect(database.updates).toEqual([
			expect.objectContaining({ status: "Completed", updatedBy: "Ada Obi" }),
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
		expect(updateTagMock).toHaveBeenCalledWith("patient-procedures-hospital-1-patient-1");
		expect(updateTagMock).toHaveBeenCalledWith("patient-procedure-details-hospital-1-PRO-1");
	});

	test("refuses a procedure that isn't pending", async () => {
		database.procedures = [
			{
				patientId: "patient-1",
				status: "Cancelled",
				procedureDate: new Date("2026-10-15T00:00:00Z"),
				updatedAt: new Date(openedUpdatedAt),
			},
		];

		expect(await markPatientProcedureCompletedAction("PRO-1", openedUpdatedAt)).toEqual({
			status: "failed",
			error: "Only a pending procedure can be marked as completed.",
		});
		expect(database.updates).toEqual([]);
	});

	test("refuses a procedure dated in the future", async () => {
		database.procedures = [
			{
				patientId: "patient-1",
				status: "Pending",
				procedureDate: new Date("2026-10-20T00:00:00Z"),
				updatedAt: new Date(openedUpdatedAt),
			},
		];

		expect(await markPatientProcedureCompletedAction("PRO-1", openedUpdatedAt)).toEqual({
			status: "failed",
			error: "A completed procedure can’t be dated in the future.",
		});
		expect(database.updates).toEqual([]);
	});

	test("refuses a procedure changed after it was opened", async () => {
		expect(await markPatientProcedureCompletedAction("PRO-1", "2026-10-13T09:00:00.000Z")).toEqual({
			status: "failed",
			error:
				"This procedure was changed after you opened it. Close it and open it again to see the latest version.",
		});
		expect(database.updates).toEqual([]);
		expect(database.history).toEqual([]);
	});

	test("refuses when the procedure changes between reading and saving", async () => {
		database.changedBeforeSaving = true;

		expect(await markPatientProcedureCompletedAction("PRO-1", openedUpdatedAt)).toEqual({
			status: "failed",
			error:
				"This procedure was changed after you opened it. Close it and open it again to see the latest version.",
		});
		expect(database.history).toEqual([]);
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("cannot complete a procedure that belongs to another hospital", async () => {
		database.procedures = [];

		expect(await markPatientProcedureCompletedAction("PRO-1", openedUpdatedAt)).toEqual({
			status: "failed",
			error: "Procedure could not be found.",
		});
		expect(database.updates).toEqual([]);
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(await markPatientProcedureCompletedAction("PRO-1", openedUpdatedAt)).toEqual({
			status: "unauthorized",
			error: "You must be signed in to edit procedures.",
		});
		expect(database.updates).toEqual([]);
	});

	test("shows a plain message and keeps the cache when the save fails", async () => {
		database.failWrites = true;
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(await markPatientProcedureCompletedAction("PRO-1", openedUpdatedAt)).toEqual({
			status: "failed",
			error: "We couldn’t save this change. Please try again.",
		});
		expect(updateTagMock).not.toHaveBeenCalled();
	});
});
