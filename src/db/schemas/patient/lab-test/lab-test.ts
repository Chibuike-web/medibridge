import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientEncounter } from "../encounter";
import { patient } from "../patient";

export const patientLabTest = pgTable("patient_lab_test", {
	id: text("id").primaryKey(),

	patientId: text("patient_id")
		.notNull()
		.references(() => patient.id, { onDelete: "cascade" }),
	encounterId: text("encounter_id").references(() => patientEncounter.id, {
		onDelete: "set null",
	}),

	testName: text("test_name").notNull(),
	result: text("result"),
	specimen: text("specimen"),
	referenceRange: text("reference_range"),
	interpretation: text("interpretation"),
	flag: text("flag"),

	orderedAt: timestamp("ordered_at"),
	orderedBy: text("ordered_by"),

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
