import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientImmunization } from "./immunization";

export const patientImmunizationHistory = pgTable("patient_immunization_history", {
	id: text("id").primaryKey(),

	immunizationId: text("immunization_id")
		.notNull()
		.references(() => patientImmunization.id, { onDelete: "cascade" }),

	fieldName: text("field_name").notNull(),
	newValue: text("new_value"),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
