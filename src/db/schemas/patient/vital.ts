import { pgTable, text, timestamp, integer, doublePrecision, index } from "drizzle-orm/pg-core";
import { patientEncounter } from "./encounter";
import { patient } from "./patient";

export const patientVital = pgTable(
	"patient_vital",
	{
		id: text("id").primaryKey(),
		patientId: text("patient_id")
			.notNull()
			.references(() => patient.id, { onDelete: "cascade" }),
		encounterId: text("encounter_id")
			.notNull()
			.references(() => patientEncounter.id, { onDelete: "restrict" }),
		createdBy: text("created_by").notNull(),
		recordedAt: timestamp("recorded_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		systolic: integer("systolic").notNull(),
		diastolic: integer("diastolic").notNull(),
		heartRate: integer("heart_rate").notNull(),
		respiratoryRate: integer("respiratory_rate").notNull(),
		temperature: doublePrecision("temperature").notNull(),
		oxygenSaturation: doublePrecision("oxygen_saturation").notNull(),
		weight: doublePrecision("weight").notNull(),
		bmi: doublePrecision("bmi").notNull(),
		notes: text("notes").notNull().default(""),
	},
	(table) => [
		index("patient_vital_patient_recorded_idx").on(table.patientId, table.recordedAt),
		index("patient_vital_encounter_idx").on(table.encounterId),
	],
);
