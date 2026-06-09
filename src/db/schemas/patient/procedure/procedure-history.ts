import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientProcedure } from "./procedure";

export const patientProcedureHistory = pgTable("patient_procedure_history", {
	id: text("id").primaryKey(),

	procedureId: text("procedure_id")
		.notNull()
		.references(() => patientProcedure.id, { onDelete: "cascade" }),

	fieldName: text("field_name").notNull(),
	newValue: text("new_value"),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
