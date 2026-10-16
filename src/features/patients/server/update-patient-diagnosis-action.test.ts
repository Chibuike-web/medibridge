// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { updatePatientDiagnosisAction } from "./update-patient-diagnosis-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, database } = vi.hoisted(() => ({
	getSessionDataMock: vi.fn(),
	getOrganizationIdMock: vi.fn(),
	updateTagMock: vi.fn(),
	database: {
		diagnoses: [] as Record<string, string | null>[],
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
					where: () => ({ limit: async () => database.diagnoses }),
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

const savedDiagnosis = {
	patientId: "patient-1",
	diagnosisName: "Asthma",
	severityStage: "Mild",
	status: "Active",
	diagnosedAt: "2019-02-10",
	diagnosedBy: "Dr. Adeyemi",
	clinicalNote: "Uses an inhaler at night.",
};

function diagnosisForm(overrides: Record<string, string> = {}) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		diagnosisName: "Asthma",
		severityStage: "Mild",
		status: "Active",
		diagnosedAt: "2019-02-10",
		diagnosedBy: "Dr. Adeyemi",
		clinicalNote: "Uses an inhaler at night.",
		...overrides,
	}))
		formData.set(field, value);
	return formData;
}

describe("editing a patient diagnosis", () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date("2026-10-15T10:00:00Z"), toFake: ["Date"] });
		database.diagnoses = [savedDiagnosis];
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
		const result = await updatePatientDiagnosisAction(
			"DIA-1",
			diagnosisForm({ status: "Resolved", diagnosedAt: "2019-03-01" }),
		);

		expect(result).toEqual({ status: "success" });
		expect(database.updates).toEqual([
			expect.objectContaining({
				status: "Resolved",
				diagnosedAt: "2019-03-01",
				diagnosisName: "Asthma",
				updatedBy: "Ada Obi",
			}),
		]);
		expect(database.history).toEqual([
			expect.objectContaining({
				diagnosisId: "DIA-1",
				fieldName: "status",
				oldValue: "Active",
				newValue: "Resolved",
				updatedBy: "Ada Obi",
			}),
			expect.objectContaining({
				diagnosisId: "DIA-1",
				fieldName: "diagnosed_at",
				oldValue: "10th February 2019",
				newValue: "1st March 2019",
				updatedBy: "Ada Obi",
			}),
		]);
		expect(database.history[0].createdAt).toEqual(database.history[1].createdAt);
		expect(updateTagMock).toHaveBeenCalledWith("patient-diagnoses-hospital-1-patient-1");
		expect(updateTagMock).toHaveBeenCalledWith("patient-diagnosis-details-hospital-1-DIA-1");
		expect(updateTagMock).toHaveBeenCalledWith("patient-profile-hospital-1-patient-1");
	});

	test("records a cleared severity and note as removed", async () => {
		await updatePatientDiagnosisAction(
			"DIA-1",
			diagnosisForm({ severityStage: "", clinicalNote: " " }),
		);

		expect(database.history).toEqual([
			expect.objectContaining({ fieldName: "severity_stage", oldValue: "Mild", newValue: null }),
			expect.objectContaining({
				fieldName: "clinical_note",
				oldValue: "Uses an inhaler at night.",
				newValue: null,
			}),
		]);
	});

	test("saving without any change writes nothing to the record or its history", async () => {
		expect(await updatePatientDiagnosisAction("DIA-1", diagnosisForm())).toEqual({
			status: "success",
		});
		expect(database.updates).toEqual([]);
		expect(database.history).toEqual([]);
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("rejects invalid changes without saving", async () => {
		expect(
			await updatePatientDiagnosisAction("DIA-1", diagnosisForm({ diagnosedBy: " " })),
		).toEqual({ status: "failed", error: "Enter who made the diagnosis." });
		expect(database.updates).toEqual([]);
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(await updatePatientDiagnosisAction("DIA-1", diagnosisForm())).toEqual({
			status: "unauthorized",
			error: "You must be signed in to edit diagnoses.",
		});
		expect(database.updates).toEqual([]);
	});

	test("cannot edit a diagnosis that belongs to another hospital", async () => {
		database.diagnoses = [];

		expect(
			await updatePatientDiagnosisAction("DIA-1", diagnosisForm({ status: "Resolved" })),
		).toEqual({ status: "failed", error: "Diagnosis could not be found." });
		expect(database.updates).toEqual([]);
	});

	test("shows a plain message and keeps the cache when the save fails", async () => {
		database.failWrites = true;
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(
			await updatePatientDiagnosisAction("DIA-1", diagnosisForm({ status: "Resolved" })),
		).toEqual({ status: "failed", error: "We couldn’t save these changes. Please try again." });
		expect(updateTagMock).not.toHaveBeenCalled();
	});
});
