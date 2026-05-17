import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientDiagnosis } from "./diagnosis";

export const patientDiagnosisHistory = pgTable("patient_diagnosis_history", {
	id: text("id").primaryKey(),

	diagnosisId: text("diagnosis_id")
		.notNull()
		.references(() => patientDiagnosis.id, { onDelete: "cascade" }),

	fieldName: text("field_name").notNull(),

	newValue: text("new_value"),

	updatedBy: text("updated_by"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});
