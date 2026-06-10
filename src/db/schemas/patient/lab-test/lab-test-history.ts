import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientLabTest } from "./lab-test";

export const patientLabTestHistory = pgTable("patient_lab_test_history", {
	id: text("id").primaryKey(),

	labTestId: text("lab_test_id")
		.notNull()
		.references(() => patientLabTest.id, { onDelete: "cascade" }),

	fieldName: text("field_name").notNull(),
	newValue: text("new_value"),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
