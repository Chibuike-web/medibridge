import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientEncounter } from "../encounter";
import { patient } from "../patient";

export const patientImaging = pgTable("patient_imaging", {
	id: text("id").primaryKey(),

	patientId: text("patient_id")
		.notNull()
		.references(() => patient.id, { onDelete: "cascade" }),
	encounterId: text("encounter_id").references(() => patientEncounter.id, {
		onDelete: "set null",
	}),

	imagingId: text("imaging_id").notNull().unique(),
	study: text("study").notNull(),
	modality: text("modality").notNull(),
	region: text("region").notNull(),
	impression: text("impression"),
	orderedAt: timestamp("ordered_at"),
	orderedBy: text("ordered_by"),
	reportedBy: text("reported_by"),
	status: text("status").notNull(),
	clinicalNote: text("clinical_note"),

	fileName: text("file_name"),
	fileUrl: text("file_url"),
	fileType: text("file_type"),
	fileSize: text("file_size"),

	createdBy: text("created_by"),
	updatedBy: text("updated_by"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
