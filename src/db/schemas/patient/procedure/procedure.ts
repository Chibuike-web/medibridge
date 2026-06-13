import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientEncounter } from "../encounter";
import { patient } from "../patient";

export const patientProcedure = pgTable("patient_procedure", {
	id: text("id").primaryKey(),

	patientId: text("patient_id")
		.notNull()
		.references(() => patient.id, { onDelete: "cascade" }),
	encounterId: text("encounter_id").references(() => patientEncounter.id, {
		onDelete: "set null",
	}),

	procedureName: text("procedure_name").notNull(),

	indication: text("indication"),
	facility: text("facility"),
	status: text("status").notNull(),

	procedureDate: timestamp("procedure_date"),
	performedBy: text("performed_by"),
	assistants: text("assistants"),

	plannedDate: timestamp("planned_date"),
	plannedPhysician: text("planned_physician"),
	plannedAssistants: text("planned_assistants"),
	plannedFacility: text("planned_facility"),

	diagnosisId: text("diagnosis_id"),
	medicationId: text("medication_id"),

	clinicalNote: text("clinical_note"),

	createdBy: text("created_by"),
	updatedBy: text("updated_by"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
