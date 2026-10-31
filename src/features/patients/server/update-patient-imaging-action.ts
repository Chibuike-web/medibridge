"use server";

import { patientUploads } from "@/lib/storage/client";
import { verifyRecordUploadsService } from "@/services/patient/verify-record-uploads-service";
import { format, parseISO } from "date-fns";
import { and, eq, gte, lt, inArray } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientImaging, patientImagingFile, patientImagingHistory } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { patientImagingSchema, recordFileExtensions } from "./schemas";

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
			updatedAt: patientImaging.updatedAt,
		})
		.from(patientImaging)
		.innerJoin(patient, eq(patientImaging.patientId, patient.id))
		.where(and(eq(patientImaging.id, imagingId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!currentImaging) {
		return { status: "failed", error: "Imaging study could not be found." };
	}

	const verifiedUploads = await verifyRecordUploadsService(formData.getAll("files"), {
		organizationId,
		userId: session.user.id,
		patientId: currentImaging.patientId,
		recordType: "imaging",
	});

	if (verifiedUploads.status === "failed") {
		return { status: "failed", error: verifiedUploads.error };
	}

	const addedFiles = verifiedUploads.files;

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

	const { patientId, updatedAt: lastSavedAt, orderedAt, ...savedImaging } = currentImaging;

	const staleRecordResult = {
		status: "failed" as const,
		error:
			"This imaging study was changed after you opened it. Close it and open it again to see the latest version.",
	};
	if (lastSavedAt.toISOString() !== formData.get("updatedAt")) {
		return staleRecordResult;
	}
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
	const updatedAt = new Date(Math.max(Date.now(), lastSavedAt.getTime() + 1));
	const historyValue = (field: keyof typeof nextImaging, value: string | null) =>
		value && field === "orderedAt" ? format(parseISO(value), "do MMMM yyyy") : value;

	const staleRecordError = new Error("Record changed before saving.");
	try {
		await db.transaction(async (tx) => {
			const [updatedRecord] = await tx
				.update(patientImaging)
				.set({ ...nextImaging, orderedAt: new Date(nextImaging.orderedAt), updatedBy, updatedAt })
				.where(
					and(
						eq(patientImaging.id, imagingId),
						// The form's timestamp has millisecond precision; database defaults can include microseconds.
						gte(patientImaging.updatedAt, lastSavedAt),
						lt(patientImaging.updatedAt, new Date(lastSavedAt.getTime() + 1)),
					),
				)
				.returning({ id: patientImaging.id });
			if (!updatedRecord) throw staleRecordError;

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
					addedFiles.map((file) => ({
						id: file.id,
						parentRecordId: imagingId,
						name: file.name,
						url: `/api/patient-record-files/${file.id}`,
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
								newValue: [...keptFiles, ...addedFiles].map((file) => file.name).join(", ") || null,
								updatedBy,
								createdAt: updatedAt,
							},
						]
					: []),
			]);
		});
	} catch (error) {
		if (error !== staleRecordError) console.error("Updating patient imaging failed:", error);
		if (error === staleRecordError) return staleRecordResult;
		return { status: "failed", error: "We couldn’t save these changes. Please try again." };
	}

	if (removedFiles.length > 0) {
		try {
			const { error } = await patientUploads.remove(
				removedFiles.map(
					(file) =>
						`${organizationId}/record-files/${file.id}${recordFileExtensions[file.type as keyof typeof recordFileExtensions] ?? ""}`,
				),
			);
			if (error) console.error("Removing replaced report files failed:", error);
		} catch (error) {
			console.error("Removing replaced report files failed:", error);
		}
	}

	updateTag(`patient-imaging-${organizationId}-${patientId}`);

	return { status: "success" };
}
