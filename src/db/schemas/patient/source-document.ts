import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patient } from "./patient";

export const patientSourceDocument = pgTable(
	"patient_source_document",
	{
		id: text("id").primaryKey(),
		patientId: text("patient_id")
			.notNull()
			.references(() => patient.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		storageKey: text("storage_key").notNull().unique(),
		uploadedBy: text("uploaded_by").notNull(),
		uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
	},
	(table) => [index("patient_source_document_patient_id_idx").on(table.patientId)],
).enableRLS();
