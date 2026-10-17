"use server";

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { format, parseISO } from "date-fns";
import { and, eq, gte, lt, inArray } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientLabTest, patientLabTestFile, patientLabTestHistory } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { patientLabTestSchema, recordFileExtensions, recordFilesSchema } from "./schemas";

type UpdatePatientLabTestResult =
	| { status: "success" }
	| { status: "failed" | "unauthorized"; error: string };

export async function updatePatientLabTestAction(
	labTestId: string,
	formData: FormData,
): Promise<UpdatePatientLabTestResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to edit lab tests." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before editing lab tests." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can edit lab tests.",
		};
	}

	const parsedLabTest = patientLabTestSchema.safeParse({
		testName: formData.get("testName") ?? "",
		status: formData.get("status"),
		flag: formData.get("flag") || undefined,
		referenceRange: formData.get("referenceRange") ?? "",
		orderedBy: formData.get("orderedBy") ?? "",
		orderedAt: formData.get("orderedAt") ?? "",
		specimen: formData.get("specimen") ?? "",
		result: formData.get("result") ?? "",
		interpretation: formData.get("interpretation") ?? "",
		clinicalNote: formData.get("clinicalNote") ?? "",
	});

	if (!parsedLabTest.success) {
		return { status: "failed", error: parsedLabTest.error.issues[0].message };
	}

	const parsedFiles = recordFilesSchema.safeParse(formData.getAll("files"));

	if (!parsedFiles.success) {
		return { status: "failed", error: parsedFiles.error.issues[0].message };
	}

	const [currentLabTest] = await db
		.select({
			patientId: patientLabTest.patientId,
			testName: patientLabTest.testName,
			status: patientLabTest.status,
			flag: patientLabTest.flag,
			referenceRange: patientLabTest.referenceRange,
			orderedBy: patientLabTest.orderedBy,
			orderedAt: patientLabTest.orderedAt,
			specimen: patientLabTest.specimen,
			result: patientLabTest.result,
			interpretation: patientLabTest.interpretation,
			clinicalNote: patientLabTest.clinicalNote,
			updatedAt: patientLabTest.updatedAt,
		})
		.from(patientLabTest)
		.innerJoin(patient, eq(patientLabTest.patientId, patient.id))
		.where(and(eq(patientLabTest.id, labTestId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!currentLabTest) {
		return { status: "failed", error: "Lab test could not be found." };
	}

	const savedFiles = await db
		.select({
			id: patientLabTestFile.id,
			name: patientLabTestFile.name,
			type: patientLabTestFile.type,
		})
		.from(patientLabTestFile)
		.where(eq(patientLabTestFile.parentRecordId, labTestId));
	const removedFileIds = formData.getAll("removedFileIds").map(String);
	const removedFiles = savedFiles.filter((file) => removedFileIds.includes(file.id));
	const keptFiles = savedFiles.filter((file) => !removedFileIds.includes(file.id));
	const addedFiles = parsedFiles.data.map((file) => ({
		id: crypto.randomUUID(),
		file,
		extension: recordFileExtensions[file.type as keyof typeof recordFileExtensions],
	}));

	if (parsedLabTest.data.status === "Completed" && keptFiles.length + addedFiles.length === 0) {
		return { status: "failed", error: "Attach the report for a completed lab test." };
	}

	const { patientId, updatedAt: lastSavedAt, orderedAt, ...savedLabTest } = currentLabTest;

	const staleRecordResult = {
		status: "failed" as const,
		error:
			"This lab test was changed after you opened it. Close it and open it again to see the latest version.",
	};
	if (lastSavedAt.toISOString() !== formData.get("updatedAt")) {
		return staleRecordResult;
	}
	const previousLabTest = {
		...savedLabTest,
		orderedAt: orderedAt?.toISOString().slice(0, 10) ?? null,
	};
	const { flag, referenceRange, result, interpretation, clinicalNote, ...labTest } =
		parsedLabTest.data;
	const nextLabTest = {
		...labTest,
		flag: flag ?? null,
		referenceRange: referenceRange || null,
		result: result || null,
		interpretation: interpretation || null,
		clinicalNote: clinicalNote || null,
	};
	const changedFields = (Object.keys(nextLabTest) as (keyof typeof nextLabTest)[]).filter(
		(field) => nextLabTest[field] !== previousLabTest[field],
	);
	const filesChanged = removedFiles.length > 0 || addedFiles.length > 0;

	if (changedFields.length === 0 && !filesChanged) {
		return { status: "success" };
	}

	const updatedBy = session.user.name || session.user.email;
	const updatedAt = new Date(Math.max(Date.now(), lastSavedAt.getTime() + 1));
	const historyValue = (field: keyof typeof nextLabTest, value: string | null) =>
		value && field === "orderedAt" ? format(parseISO(value), "do MMMM yyyy") : value;
	const fileDirectory = path.resolve("patient-uploads", organizationId, "record-files", labTestId);

	const staleRecordError = new Error("Record changed before saving.");
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
			const [updatedRecord] = await tx
				.update(patientLabTest)
				.set({ ...nextLabTest, orderedAt: new Date(nextLabTest.orderedAt), updatedBy, updatedAt })
				.where(
					and(
						eq(patientLabTest.id, labTestId),
						// The form's timestamp has millisecond precision; database defaults can include microseconds.
						gte(patientLabTest.updatedAt, lastSavedAt),
						lt(patientLabTest.updatedAt, new Date(lastSavedAt.getTime() + 1)),
					),
				)
				.returning({ id: patientLabTest.id });
			if (!updatedRecord) throw staleRecordError;

			if (removedFiles.length > 0) {
				await tx.delete(patientLabTestFile).where(
					inArray(
						patientLabTestFile.id,
						removedFiles.map((file) => file.id),
					),
				);
			}

			if (addedFiles.length > 0) {
				await tx.insert(patientLabTestFile).values(
					addedFiles.map(({ id, file }) => ({
						id,
						parentRecordId: labTestId,
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

			await tx.insert(patientLabTestHistory).values([
				...changedFields.map((field) => ({
					id: crypto.randomUUID(),
					labTestId,
					fieldName: field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
					oldValue: historyValue(field, previousLabTest[field]),
					newValue: historyValue(field, nextLabTest[field]),
					updatedBy,
					createdAt: updatedAt,
				})),
				...(filesChanged
					? [
							{
								id: crypto.randomUUID(),
								labTestId,
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
		if (error !== staleRecordError) console.error("Updating patient lab test failed:", error);
		await Promise.all(
			addedFiles.map(({ id, extension }) =>
				rm(path.join(fileDirectory, `${id}${extension}`), { force: true }),
			),
		).catch((cleanupError) =>
			console.error("Removing unsaved lab test files failed:", cleanupError),
		);
		if (error === staleRecordError) return staleRecordResult;
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
	).catch((error) => console.error("Removing replaced lab test files failed:", error));

	updateTag(`patient-lab-tests-${organizationId}-${patientId}`);

	return { status: "success" };
}
