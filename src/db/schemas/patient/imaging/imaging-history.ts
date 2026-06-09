import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientImaging } from "./imaging";

export const patientImagingHistory = pgTable("patient_imaging_history", {
	id: text("id").primaryKey(),

	imagingId: text("imaging_id")
		.notNull()
		.references(() => patientImaging.id, { onDelete: "cascade" }),

	fieldName: text("field_name").notNull(),
	newValue: text("new_value"),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
