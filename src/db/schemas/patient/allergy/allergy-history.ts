import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientAllergy } from "./allergy";

export const patientAllergyHistory = pgTable("patient_allergy_history", {
	id: text("id").primaryKey(),

	allergyId: text("allergy_id")
		.notNull()
		.references(() => patientAllergy.id, { onDelete: "cascade" }),

	fieldName: text("field_name").notNull(),
	newValue: text("new_value"),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
