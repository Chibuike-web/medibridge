import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { desc, eq } from "drizzle-orm";
import { patient, patientEncounter, patientVital } from "./schemas";
import { ENV } from "../lib/utils/env";

const patientId = process.argv[2];
if (!patientId) throw new Error("Usage: bun src/db/seed-vitals.ts <patient-id>");
const sql = postgres(ENV.DATABASE_URL);
const db = drizzle(sql);
try {
	const [existingPatient] = await db
		.select({ id: patient.id })
		.from(patient)
		.where(eq(patient.id, patientId));
	if (!existingPatient) throw new Error("Patient not found; no readings were inserted.");
	const [encounter] = await db
		.select({ id: patientEncounter.id, createdBy: patientEncounter.createdBy })
		.from(patientEncounter)
		.where(eq(patientEncounter.patientId, patientId))
		.orderBy(desc(patientEncounter.encounterDate))
		.limit(1);
	if (!encounter) throw new Error("Create an encounter before seeding vitals.");
	const existingVitals = await db
		.select({ id: patientVital.id })
		.from(patientVital)
		.where(eq(patientVital.patientId, patientId));
	const legacySeedPrefix = `SEED-VITAL-${patientId}-`;
	const legacySeedVitals = existingVitals.filter(({ id }) => id.startsWith(legacySeedPrefix));
	for (const vital of legacySeedVitals) {
		await db
			.update(patientVital)
			.set({ id: `VIT-${crypto.randomUUID()}` })
			.where(eq(patientVital.id, vital.id));
	}
	if (existingVitals.length > 0) {
		console.log(
			legacySeedVitals.length > 0
				? `Updated ${legacySeedVitals.length} legacy vital IDs for ${patientId}.`
				: `Vitals already exist for ${patientId}; no readings were inserted.`,
		);
	} else {
		const anchor = new Date();
		anchor.setUTCHours(9, 0, 0, 0);
		const rows = Array.from({ length: 24 }, (_, index) => ({
			id: `VIT-${crypto.randomUUID()}`,
			patientId,
			encounterId: encounter.id,
			createdBy: encounter.createdBy,
			recordedAt: new Date(anchor.getTime() - index * 3 * 86400000),
			systolic: [120, 118, 122, 119, 121, 125][index % 6],
			diastolic: [80, 79, 81, 80, 78, 82][index % 6],
			heartRate: [72, 68, 75, 70, 74, 76][index % 6],
			respiratoryRate: [16, 14, 18, 15, 16, 20][index % 6],
			temperature: [36.4, 37, 36.8, 36.5][index % 4],
			oxygenSaturation: [98, 99, 97][index % 3],
			weight: 70 + (index % 3),
			bmi: Number((22.9 + (index % 3) * 0.3).toFixed(1)),
			notes: "Synthetic development seed reading.",
		}));
		const inserted = await db
			.insert(patientVital)
			.values(rows)
			.onConflictDoNothing()
			.returning({ id: patientVital.id });
		console.log(`Inserted ${inserted.length} vitals for ${patientId}.`);
	}
} finally {
	await sql.end();
}
