// @vitest-environment node

import path from "node:path";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPatientImagingAction } from "./create-patient-imaging-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, database, disk } = vi.hoisted(
	() => ({
		getSessionDataMock: vi.fn(),
		getOrganizationIdMock: vi.fn(),
		updateTagMock: vi.fn(),
		database: {
			patients: [] as { id: string }[],
			encounters: [] as { id: string }[],
			imaging: [] as Record<string, unknown>[],
			files: [] as Record<string, unknown>[],
			failWrites: false,
		},
		disk: { files: new Map<string, Buffer>(), writes: [] as string[] },
	}),
);

vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("next/cache", () => ({ updateTag: updateTagMock }));
vi.mock("node:fs/promises", async () => {
	const { sep } = await import("node:path");

	return {
		mkdir: async () => {},
		writeFile: async (file: string, contents: Buffer) => {
			disk.files.set(file, contents);
			disk.writes.push(file);
		},
		rm: async (target: string, options: { recursive?: boolean }) => {
			for (const file of disk.files.keys())
				if (file === target || (options.recursive && file.startsWith(`${target}${sep}`)))
					disk.files.delete(file);
		},
	};
});
vi.mock("@/lib/better-auth/auth", async () => {
	const { patientEncounter, patientImagingFile } = await import("@/db/schemas");

	return {
		db: {
			select: () => ({
				from: (table: unknown) => ({
					where: () => ({
						limit: async () =>
							table === patientEncounter ? database.encounters : database.patients,
					}),
				}),
			}),
			transaction: async (write: (tx: object) => Promise<void>) => {
				if (database.failWrites) throw new Error("connection lost");

				await write({
					insert: (table: unknown) => ({
						values: async (rows: Record<string, unknown> | Record<string, unknown>[]) => {
							(table === patientImagingFile ? database.files : database.imaging).push(
								...[rows].flat(),
							);
						},
					}),
				});
			},
		},
	};
});

const imagingFolders = path.resolve("patient-uploads", "hospital-1", "record-files");
const chestFilm = new File(["png chest film"], "chest-pa.png", { type: "image/png" });
const completedStudy = { status: "Completed", impression: "No focal consolidation." };

function imagingForm(overrides: Record<string, string> = {}, files: File[] = []) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		study: "Chest X-ray",
		region: "Chest",
		modality: "X-ray",
		orderedAt: "2026-10-14",
		orderedBy: "Dr. Ada Obi",
		status: "Pending",
		impression: "",
		clinicalNote: "",
		...overrides,
	}))
		formData.set(field, value);
	for (const file of files) formData.append("files", file);
	return formData;
}

describe("adding a patient imaging study", () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date("2026-10-15T10:00:00Z"), toFake: ["Date"] });
		database.patients = [{ id: "patient-1" }];
		database.encounters = [{ id: "ENC-1" }];
		database.imaging = [];
		database.files = [];
		database.failWrites = false;
		disk.files.clear();
		disk.writes = [];
		getSessionDataMock.mockResolvedValue({
			user: { id: "member-1", name: "Ada Obi", emailVerified: true },
		});
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	test("a verified hospital member can order a pending study without images", async () => {
		const result = await createPatientImagingAction("patient-1", imagingForm());

		expect(result).toEqual({ status: "success", imagingId: expect.stringMatching(/^IMG-/) });
		expect(database.imaging).toEqual([
			{
				id: result.status === "success" ? result.imagingId : "",
				patientId: "patient-1",
				encounterId: null,
				study: "Chest X-ray",
				region: "Chest",
				modality: "X-ray",
				orderedAt: new Date("2026-10-14"),
				orderedBy: "Dr. Ada Obi",
				status: "Pending",
				impression: null,
				clinicalNote: null,
				createdBy: "Ada Obi",
				updatedBy: "Ada Obi",
			},
		]);
		expect(database.files).toEqual([]);
		expect(disk.files.size).toBe(0);
		expect(updateTagMock).toHaveBeenCalledWith("patient-imaging-hospital-1-patient-1");
	});

	test("links the study to the patient's encounter it was ordered from", async () => {
		await createPatientImagingAction("patient-1", imagingForm({ encounterId: "ENC-1" }));

		expect(database.imaging).toEqual([expect.objectContaining({ encounterId: "ENC-1" })]);
	});

	test("a completed study can be saved with its impression and no images", async () => {
		const result = await createPatientImagingAction("patient-1", imagingForm(completedStudy));

		expect(result).toEqual({ status: "success", imagingId: expect.stringMatching(/^IMG-/) });
		expect(database.imaging).toEqual([
			expect.objectContaining({ status: "Completed", impression: "No focal consolidation." }),
		]);
		expect(database.files).toEqual([]);
	});

	test("stores each attached image in the study's folder and lists it with a viewer link", async () => {
		const result = await createPatientImagingAction(
			"patient-1",
			imagingForm(completedStudy, [chestFilm]),
		);

		expect(result).toEqual({ status: "success", imagingId: expect.stringMatching(/^IMG-/) });
		const imagingId = result.status === "success" ? result.imagingId : "";
		const [savedFilm] = database.files as { id: string }[];
		expect(database.files).toEqual([
			{
				id: savedFilm.id,
				parentRecordId: imagingId,
				name: "chest-pa.png",
				url: `/api/patient-record-files/${savedFilm.id}`,
				type: "image/png",
				size: "1 KB",
				uploadedBy: "Ada Obi",
			},
		]);
		expect(disk.files.size).toBe(1);
		expect(
			disk.files.get(path.join(imagingFolders, imagingId, `${savedFilm.id}.png`))?.toString(),
		).toBe("png chest film");
	});

	test("a completed study without an impression is rejected without saving or storing images", async () => {
		expect(
			await createPatientImagingAction(
				"patient-1",
				imagingForm({ ...completedStudy, impression: "  " }, [chestFilm]),
			),
		).toEqual({ status: "failed", error: "Enter the impression of a completed study." });
		expect(database.imaging).toEqual([]);
		expect(disk.files.size).toBe(0);
	});

	test("rejects an image that is not a PDF, PNG or JPG without storing any file", async () => {
		const scan = new File(["dicom"], "chest.dcm", { type: "application/dicom" });

		expect(
			await createPatientImagingAction("patient-1", imagingForm(completedStudy, [chestFilm, scan])),
		).toEqual({ status: "failed", error: "Files must be PDF, PNG or JPG." });
		expect(database.imaging).toEqual([]);
		expect(disk.files.size).toBe(0);
	});

	test("removes the stored images and shows a plain message when the save fails", async () => {
		database.failWrites = true;
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(
			await createPatientImagingAction("patient-1", imagingForm(completedStudy, [chestFilm])),
		).toEqual({
			status: "failed",
			error: "We couldn’t add this imaging study. Please try again.",
		});
		expect(disk.writes).toEqual([expect.stringContaining(path.join(imagingFolders, "IMG-"))]);
		expect(disk.files.size).toBe(0);
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(
			await createPatientImagingAction("patient-1", imagingForm(completedStudy, [chestFilm])),
		).toEqual({ status: "unauthorized", error: "You must be signed in to add imaging." });
		expect(database.imaging).toEqual([]);
		expect(disk.files.size).toBe(0);
	});

	test.each([
		{
			scenario: "their email is unverified",
			setup: () =>
				getSessionDataMock.mockResolvedValue({
					user: { id: "member-1", name: "Ada Obi", emailVerified: false },
				}),
			error: "Verify your email before adding imaging.",
		},
		{
			scenario: "their hospital is unverified",
			setup: () => getOrganizationIdMock.mockResolvedValue(null),
			error: "Your hospital must be verified before you can add imaging.",
		},
		{
			scenario: "the patient belongs to another hospital",
			setup: () => {
				database.patients = [];
			},
			error: "Patient could not be found.",
		},
		{
			scenario: "the encounter belongs to another patient",
			setup: () => {
				database.encounters = [];
			},
			error: "This encounter could not be found for the patient.",
		},
	])("cannot add a study when $scenario", async ({ setup, error }) => {
		setup();

		expect(
			await createPatientImagingAction(
				"patient-1",
				imagingForm({ ...completedStudy, encounterId: "ENC-1" }, [chestFilm]),
			),
		).toEqual({ status: "failed", error });
		expect(database.imaging).toEqual([]);
		expect(database.files).toEqual([]);
		expect(disk.files.size).toBe(0);
	});
});
