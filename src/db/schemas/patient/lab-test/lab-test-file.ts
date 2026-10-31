import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientLabTest } from "./lab-test";

export const patientLabTestFile = pgTable(
	"patient_lab_test_file",
	{
		id: text("id").primaryKey(),
		parentRecordId: text("parent_record_id")
			.notNull()
			.references(() => patientLabTest.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		url: text("url"),
		type: text("type"),
		size: text("size"),
		uploadedBy: text("uploaded_by"),
		uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
	},
	(table) => [index("patient_lab_test_file_parent_record_id_idx").on(table.parentRecordId)],
).enableRLS();
