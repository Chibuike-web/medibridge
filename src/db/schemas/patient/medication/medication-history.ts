import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientMedication } from "./medication";

export const patientMedicationHistory = pgTable("patient_medication_history", {
	id: text("id").primaryKey(),
	medicationId: text("medication_id")
		.notNull()
		.references(() => patientMedication.id, { onDelete: "cascade" }),
	fieldName: text("field_name").notNull(),
	newValue: text("new_value"),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
