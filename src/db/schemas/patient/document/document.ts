import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientEncounter } from "../encounter";
import { patient } from "../patient";

export const patientDocument = pgTable("patient_document", {
	id: text("id").primaryKey(),
	patientId: text("patient_id")
		.notNull()
		.references(() => patient.id, { onDelete: "cascade" }),
	encounterId: text("encounter_id").references(() => patientEncounter.id, {
		onDelete: "set null",
	}),
	title: text("title").notNull(),
	documentType: text("document_type").notNull(),
	clinicalNotes: text("clinical_notes"),
	createdBy: text("created_by"),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
