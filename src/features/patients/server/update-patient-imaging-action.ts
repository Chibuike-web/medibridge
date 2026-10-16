"use server";

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { format, parseISO } from "date-fns";
import { and, eq, inArray } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientImaging, patientImagingFile, patientImagingHistory } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { patientImagingSchema, recordFileExtensions, recordFilesSchema } from "./schemas";

type UpdatePatientImagingResult =
	| { status: "success" }
	| { status: "failed" | "unauthorized"; error: string };

export async function updatePatientImagingAction(
	imagingId: string,
	formData: FormData,
): Promise<UpdatePatientImagingResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to edit imaging." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before editing imaging." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can edit imaging.",
		};
	}

	const parsedImaging = patientImagingSchema.safeParse({
		study: formData.get("study") ?? "",
		region: formData.get("region") ?? "",
		modality: formData.get("modality"),
		orderedAt: formData.get("orderedAt") ?? "",
		orderedBy: formData.get("orderedBy") ?? "",
		status: formData.get("status"),
		impression: formData.get("impression") ?? "",
		clinicalNote: formData.get("clinicalNote") ?? "",
	});

	if (!parsedImaging.success) {
		return { status: "failed", error: parsedImaging.error.issues[0].message };
	}

	const parsedFiles = recordFilesSchema.safeParse(formData.getAll("files"));

	if (!parsedFiles.success) {
		return { status: "failed", error: parsedFiles.error.issues[0].message };
	}

	const [currentImaging] = await db
		.select({
			patientId: patientImaging.patientId,
			study: patientImaging.study,
			region: patientImaging.region,
			modality: patientImaging.modality,
			orderedAt: patientImaging.orderedAt,
			orderedBy: patientImaging.orderedBy,
			status: patientImaging.status,
			impression: patientImaging.impression,
			clinicalNote: patientImaging.clinicalNote,
		})
		.from(patientImaging)
		.innerJoin(patient, eq(patientImaging.patientId, patient.id))
		.where(and(eq(patientImaging.id, imagingId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!currentImaging) {
		return { status: "failed", error: "Imaging study could not be found." };
	}

	const savedFiles = await db
		.select({
			id: patientImagingFile.id,
			name: patientImagingFile.name,
			type: patientImagingFile.type,
		})
		.from(patientImagingFile)
		.where(eq(patientImagingFile.parentRecordId, imagingId));
	const removedFileIds = formData.getAll("removedFileIds").map(String);
	const removedFiles = savedFiles.filter((file) => removedFileIds.includes(file.id));
	const keptFiles = savedFiles.filter((file) => !removedFileIds.includes(file.id));
	const addedFiles = parsedFiles.data.map((file) => ({
		id: crypto.randomUUID(),
		file,
		extension: recordFileExtensions[file.type as keyof typeof recordFileExtensions],
	}));

	const { patientId, orderedAt, ...savedImaging } = currentImaging;
	const previousImaging = {
		...savedImaging,
		orderedAt: orderedAt?.toISOString().slice(0, 10) ?? null,
	};
	const { impression, clinicalNote, ...imaging } = parsedImaging.data;
	const nextImaging = {
		...imaging,
		impression: impression || null,
		clinicalNote: clinicalNote || null,
	};
	const changedFields = (Object.keys(nextImaging) as (keyof typeof nextImaging)[]).filter(
		(field) => nextImaging[field] !== previousImaging[field],
	);
	const filesChanged = removedFiles.length > 0 || addedFiles.length > 0;

	if (changedFields.length === 0 && !filesChanged) {
		return { status: "success" };
	}

	const updatedBy = session.user.name || session.user.email;
	const updatedAt = new Date();
	const historyValue = (field: keyof typeof nextImaging, value: string | null) =>
		value && field === "orderedAt" ? format(parseISO(value), "do MMMM yyyy") : value;
	const fileDirectory = path.resolve("patient-uploads", organizationId, "record-files", imagingId);

	try {
		if (addedFiles.length > 0) {
			await mkdir(fileDirectory, { recursive: true });
			await Promise.all(
				addedFiles.map(async ({ id, file, extension }) =>
					writeFile(
						path.join(fileDirectory, `${id}${extension}`),
						Buffer.from(await file.arrayBuffer()),
					),
				),
			);
		}

		await db.transaction(async (tx) => {
			await tx
				.update(patientImaging)
				.set({ ...nextImaging, orderedAt: new Date(nextImaging.orderedAt), updatedBy, updatedAt })
				.where(eq(patientImaging.id, imagingId));

			if (removedFiles.length > 0) {
				await tx.delete(patientImagingFile).where(
					inArray(
						patientImagingFile.id,
						removedFiles.map((file) => file.id),
					),
				);
			}

			if (addedFiles.length > 0) {
				await tx.insert(patientImagingFile).values(
					addedFiles.map(({ id, file }) => ({
						id,
						parentRecordId: imagingId,
						name: file.name,
						url: `/api/patient-record-files/${id}`,
						type: file.type,
						size:
							file.size >= 1024 * 1024
								? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
								: `${Math.ceil(file.size / 1024)} KB`,
						uploadedBy: updatedBy,
					})),
				);
			}

			await tx.insert(patientImagingHistory).values([
				...changedFields.map((field) => ({
					id: crypto.randomUUID(),
					imagingId,
					fieldName: field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
					oldValue: historyValue(field, previousImaging[field]),
					newValue: historyValue(field, nextImaging[field]),
					updatedBy,
					createdAt: updatedAt,
				})),
				...(filesChanged
					? [
							{
								id: crypto.randomUUID(),
								imagingId,
								fieldName: "files",
								oldValue: savedFiles.map((file) => file.name).join(", ") || null,
								newValue:
									[...keptFiles, ...addedFiles.map(({ file }) => file)]
										.map((file) => file.name)
										.join(", ") || null,
								updatedBy,
								createdAt: updatedAt,
							},
						]
					: []),
			]);
		});
	} catch (error) {
		console.error("Updating patient imaging failed:", error);
		await Promise.all(
			addedFiles.map(({ id, extension }) =>
				rm(path.join(fileDirectory, `${id}${extension}`), { force: true }),
			),
		).catch((cleanupError) =>
			console.error("Removing unsaved imaging files failed:", cleanupError),
		);
		return { status: "failed", error: "We couldn’t save these changes. Please try again." };
	}

	await Promise.all(
		removedFiles.map((file) =>
			rm(
				path.join(
					fileDirectory,
					`${file.id}${recordFileExtensions[file.type as keyof typeof recordFileExtensions] ?? ""}`,
				),
				{ force: true },
			),
		),
	).catch((error) => console.error("Removing replaced imaging files failed:", error));

	updateTag(`patient-imaging-${organizationId}-${patientId}`);

	return { status: "success" };
}
