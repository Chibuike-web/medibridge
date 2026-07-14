import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientImaging } from "./imaging";

export const patientImagingFile = pgTable(
	"patient_imaging_file",
	{
		id: text("id").primaryKey(),
		parentRecordId: text("parent_record_id")
			.notNull()
			.references(() => patientImaging.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		url: text("url"),
		type: text("type"),
		size: text("size"),
		uploadedBy: text("uploaded_by"),
		uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
	},
	(table) => [index("patient_imaging_file_parent_record_id_idx").on(table.parentRecordId)],
);
