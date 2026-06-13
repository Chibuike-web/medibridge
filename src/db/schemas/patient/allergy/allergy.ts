import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientEncounter } from "../encounter";
import { patient } from "../patient";

export const patientAllergy = pgTable("patient_allergy", {
	id: text("id").primaryKey(),

	patientId: text("patient_id")
		.notNull()
		.references(() => patient.id, { onDelete: "cascade" }),
	encounterId: text("encounter_id").references(() => patientEncounter.id, {
		onDelete: "set null",
	}),

	allergen: text("allergen").notNull(),
	reaction: text("reaction").notNull(),
	severity: text("severity").notNull(),
	status: text("status").notNull(),
	clinicalNote: text("clinical_note"),

	createdBy: text("created_by"),
	updatedBy: text("updated_by"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
