import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientEncounter } from "../encounter";
import { patient } from "../patient";

export const patientImmunization = pgTable("patient_immunization", {
	id: text("id").primaryKey(),

	patientId: text("patient_id")
		.notNull()
		.references(() => patient.id, { onDelete: "cascade" }),
	encounterId: text("encounter_id").references(() => patientEncounter.id, {
		onDelete: "set null",
	}),

	immunizationId: text("immunization_id").notNull().unique(),
	vaccineName: text("vaccine_name").notNull(),

	currentDose: text("current_dose"),
	totalDoses: text("total_doses"),
	seriesType: text("series_type"),

	dateAdministered: timestamp("date_administered"),
	administeredBy: text("administered_by"),

	status: text("status").notNull(),

	clinicalNote: text("clinical_note"),

	createdBy: text("created_by"),
	updatedBy: text("updated_by"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
