import bcrypt from "bcrypt";
import { and, asc, eq } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schemas";
import type {
	PatientRecordAccessPermissions,
	PatientRecordAccessSection,
	PatientRecordAccessSelectedRecord,
} from "./schemas";
import { ENV } from "../lib/utils/env";

const DEVELOPMENT_ACCESS_ID = "ACC-DEMO-SHARED-RECORD";
const DEVELOPMENT_VERIFICATION_CODE = "123456";

const contentTypeToSection: Record<
	string,
	PatientRecordAccessSection | undefined
> = {
	diagnoses: "diagnoses",
	allergies: "allergies",
	immunization: "immunizations",
	immunizations: "immunizations",
	procedures: "procedures",
	medications: "medications",
	labs: "lab-tests",
	"lab-tests": "lab-tests",
	imaging: "imaging",
};

function buildPermissions(
	selectedRecords: PatientRecordAccessSelectedRecord[],
) {
	const permissions: PatientRecordAccessPermissions = {};

	for (const record of selectedRecords) {
		if (record.section === "lab-tests") permissions.labTests = true;
		else permissions[record.section] = true;
	}

	return permissions;
}

async function seedSharedRecord() {
	const sql = postgres(ENV.DATABASE_URL);
	const db = drizzle({ client: sql, schema });

	try {
		async function recordExistsForPatient(
			selectedRecord: PatientRecordAccessSelectedRecord,
			patientId: string,
		) {
			if (selectedRecord.section === "encounters") return false;

			const tableBySection = {
				diagnoses: schema.patientDiagnosis,
				allergies: schema.patientAllergy,
				immunizations: schema.patientImmunization,
				procedures: schema.patientProcedure,
				medications: schema.patientMedication,
				"lab-tests": schema.patientLabTest,
				imaging: schema.patientImaging,
			} as const;
			const table = tableBySection[selectedRecord.section];
			const rows = await db
				.select({ id: table.id })
				.from(table)
				.where(
					and(
						eq(table.id, selectedRecord.recordId),
						eq(table.patientId, patientId),
					),
				)
				.limit(1);

			return rows.length > 0;
		}

		const transfers = await db
			.select({
				id: schema.patientTransfer.id,
				patientId: schema.patientTransfer.patientId,
				sourceOrganizationId: schema.patientTransfer.sourceOrganizationId,
				createdBy: schema.patientTransfer.createdBy,
				requestedBy: schema.patientTransfer.requestedBy,
				targetHospitalName: schema.patientTransfer.targetHospitalName,
				targetHospitalEmail: schema.patientTransfer.targetHospitalEmail,
			})
			.from(schema.patientTransfer)
			.orderBy(asc(schema.patientTransfer.requestedAt))
			.limit(100);

		let selectedTransfer: (typeof transfers)[number] | undefined;
		let selectedRecords: PatientRecordAccessSelectedRecord[] = [];

		for (const transfer of transfers) {
			const contentRows = await db
				.select({
					contentType: schema.patientTransferContent.contentType,
					recordId: schema.patientTransferContent.recordId,
				})
				.from(schema.patientTransferContent)
				.where(eq(schema.patientTransferContent.transferId, transfer.id));
			const candidateRecords = contentRows.flatMap((contentRow) => {
				const section = contentTypeToSection[contentRow.contentType];
				return section ? [{ section, recordId: contentRow.recordId }] : [];
			});
			const validatedRecords = await Promise.all(
				candidateRecords.map(async (selectedRecord) =>
					(await recordExistsForPatient(selectedRecord, transfer.patientId))
						? selectedRecord
						: null,
				),
			);
			const supportedRecords = validatedRecords.filter(
				(selectedRecord): selectedRecord is PatientRecordAccessSelectedRecord =>
					selectedRecord !== null,
			);

			if (
				supportedRecords.length > 0 &&
				(transfer.createdBy || transfer.requestedBy)
			) {
				selectedTransfer = transfer;
				selectedRecords = supportedRecords;
				break;
			}
		}

		if (!selectedTransfer) {
			throw new Error(
				"No seeded transfer with supported clinical records was found. Run db:seed or db:sync-hospitals first.",
			);
		}

		const now = new Date();
		const accessExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
		const codeExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
		const codeHash = await bcrypt.hash(DEVELOPMENT_VERIFICATION_CODE, 10);
		const createdByUserId =
			selectedTransfer.createdBy ?? selectedTransfer.requestedBy!;

		await db.transaction(async (tx) => {
			await tx
				.insert(schema.patientRecordAccess)
				.values({
					id: DEVELOPMENT_ACCESS_ID,
					patientTransferId: selectedTransfer.id,
					patientId: selectedTransfer.patientId,
					createdByOrganizationId: selectedTransfer.sourceOrganizationId,
					createdByUserId,
					status: "pending",
					expiresAt: accessExpiresAt,
					verifiedAt: null,
					revokedAt: null,
					permissions: buildPermissions(selectedRecords),
					selectedRecordIds: selectedRecords,
					updatedAt: now,
				})
				.onConflictDoUpdate({
					target: schema.patientRecordAccess.id,
					set: {
						patientTransferId: selectedTransfer.id,
						patientId: selectedTransfer.patientId,
						createdByOrganizationId: selectedTransfer.sourceOrganizationId,
						createdByUserId,
						status: "pending",
						expiresAt: accessExpiresAt,
						verifiedAt: null,
						revokedAt: null,
						permissions: buildPermissions(selectedRecords),
						selectedRecordIds: selectedRecords,
						updatedAt: now,
					},
				});

			await tx
				.delete(schema.patientRecordAccessVerification)
				.where(
					eq(
						schema.patientRecordAccessVerification.accessId,
						DEVELOPMENT_ACCESS_ID,
					),
				);

			await tx.insert(schema.patientRecordAccessVerification).values({
				id: `VRF-${crypto.randomUUID()}`,
				accessId: DEVELOPMENT_ACCESS_ID,
				codeHash,
				codeExpiresAt,
				targetHospitalEmail: selectedTransfer.targetHospitalEmail ?? "recipient@example.com",
				targetHospitalName: selectedTransfer.targetHospitalName,
			});
		});

		console.log("Shared-record development access seeded.");
		console.log(
			`Access URL: ${new URL(`/verify-access/${DEVELOPMENT_ACCESS_ID}`, ENV.BETTER_AUTH_URL)}`,
		);
		console.log(`Verification code: ${DEVELOPMENT_VERIFICATION_CODE}`);
		console.log(`Selected real database records: ${selectedRecords.length}`);
	} finally {
		await sql.end();
	}
}

seedSharedRecord().catch((error) => {
	console.error("Shared-record seed failed:", error);
	process.exit(1);
});
