import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientEncounter } from "../encounter";
import { patient } from "../patient";

export const patientDiagnosis = pgTable("patient_diagnosis", {
	id: text("id").primaryKey(),

	patientId: text("patient_id")
		.notNull()
		.references(() => patient.id, { onDelete: "cascade" }),
	encounterId: text("encounter_id").references(() => patientEncounter.id, {
		onDelete: "set null",
	}),

	diagnosisName: text("diagnosis_name").notNull(),

	status: text("status").notNull(),

	severityStage: text("severity_stage"),

	onsetDate: text("onset_date"),
	lastReviewedAt: text("last_reviewed_at"),

	clinicalNote: text("clinical_note"),

	diagnosedBy: text("diagnosed_by"),

	createdBy: text("created_by"),
	updatedBy: text("updated_by"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
