import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schemas";
import { ENV } from "../lib/utils/env";

type SeedStep = {
	name: string;
	table: any;
	file: string;
};

type SeedModule = {
	default?: unknown[];
	rows?: unknown[];
	seed?: unknown[];
};

const INSERT_BATCH_SIZE = 500;

const seedSteps: SeedStep[] = [
	{ name: "organization", table: schema.organization, file: "organization.ts" },
	{ name: "user", table: schema.user, file: "user.ts" },
	{ name: "account", table: schema.account, file: "account.ts" },
	{ name: "session", table: schema.session, file: "session.ts" },
	{ name: "member", table: schema.member, file: "member.ts" },
	{ name: "invitation", table: schema.invitation, file: "invitation.ts" },
	{ name: "verification", table: schema.verification, file: "verification.ts" },
	{
		name: "hospitalDetails",
		table: schema.hospitalDetails,
		file: "hospital-details.ts",
	},
	{ name: "patient", table: schema.patient, file: "patient.ts" },
	{
		name: "patientPersonalInformation",
		table: schema.patientPersonalInformation,
		file: "patient-personal-information.ts",
	},
	{
		name: "patientContactInformation",
		table: schema.patientContactInformation,
		file: "patient-contact-information.ts",
	},
	{
		name: "patientEmergencyContact",
		table: schema.patientEmergencyContact,
		file: "patient-emergency-contact.ts",
	},
	{
		name: "patientPhysicalInformation",
		table: schema.patientPhysicalInformation,
		file: "patient-physical-information.ts",
	},
	{
		name: "patientEncounter",
		table: schema.patientEncounter,
		file: "patient-encounter.ts",
	},
	{
		name: "patientAllergy",
		table: schema.patientAllergy,
		file: "patient-allergy.ts",
	},
	{
		name: "patientAllergyHistory",
		table: schema.patientAllergyHistory,
		file: "patient-allergy-history.ts",
	},
	{
		name: "patientDiagnosis",
		table: schema.patientDiagnosis,
		file: "patient-diagnosis.ts",
	},
	{
		name: "patientDiagnosisHistory",
		table: schema.patientDiagnosisHistory,
		file: "patient-diagnosis-history.ts",
	},
	{
		name: "patientMedication",
		table: schema.patientMedication,
		file: "patient-medication.ts",
	},
	{
		name: "patientMedicationHistory",
		table: schema.patientMedicationHistory,
		file: "patient-medication-history.ts",
	},
	{
		name: "patientLabTest",
		table: schema.patientLabTest,
		file: "patient-lab-test.ts",
	},
	{
		name: "patientLabTestHistory",
		table: schema.patientLabTestHistory,
		file: "patient-lab-test-history.ts",
	},
	{
		name: "patientTransfer",
		table: schema.patientTransfer,
		file: "patient-transfer.ts",
	},
	{
		name: "patientTransferProgress",
		table: schema.patientTransferProgress,
		file: "patient-transfer-progress.ts",
	},
	{
		name: "patientTransferContent",
		table: schema.patientTransferContent,
		file: "patient-transfer-content.ts",
	},
];

function getRows(seedModule: SeedModule, stepName: string) {
	const rows = seedModule.default ?? seedModule.rows ?? seedModule.seed ?? [];

	if (!Array.isArray(rows)) {
		throw new Error(`${stepName} seed file must export an array`);
	}

	return rows;
}

async function loadSeedFile(file: string): Promise<SeedModule | null> {
	const seedUrl = new URL(`./table-seeds/${file}`, import.meta.url);

	try {
		return (await import(seedUrl.href)) as SeedModule;
	} catch (error) {
		if (error instanceof Error && error.message.includes("Cannot find module")) {
			return null;
		}

		throw error;
	}
}

async function runTableSeeds() {
	const sql = postgres(ENV.DATABASE_URL!);
	const db = drizzle({ client: sql, schema });

	try {
		console.log("Starting table seed runner...");

		for (const step of seedSteps) {
			const seedModule = await loadSeedFile(step.file);

			if (!seedModule) {
				console.log(`Skipped ${step.name}: missing ${step.file}`);
				continue;
			}

			const rows = getRows(seedModule, step.name);

			if (rows.length === 0) {
				console.log(`Skipped ${step.name}: no rows`);
				continue;
			}

			for (let index = 0; index < rows.length; index += INSERT_BATCH_SIZE) {
				await db
					.insert(step.table)
					.values(rows.slice(index, index + INSERT_BATCH_SIZE))
					.onConflictDoNothing();
			}
			console.log(`Seeded ${step.name}: ${rows.length} rows`);
		}

		console.log("Table seed runner completed.");
	} finally {
		await sql.end();
	}
}

runTableSeeds().catch((error) => {
	console.error("Table seed runner failed:", error);
	process.exit(1);
});
