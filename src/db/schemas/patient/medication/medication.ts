import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientEncounter } from "../encounter";
import { patient } from "../patient";

export const patientMedication = pgTable("patient_medication", {
	id: text("id").primaryKey(),
	patientId: text("patient_id")
		.notNull()
		.references(() => patient.id, { onDelete: "cascade" }),
	encounterId: text("encounter_id").references(() => patientEncounter.id, {
		onDelete: "set null",
	}),
	medicationName: text("medication_name").notNull(),
	dose: text("dose"),
	route: text("route"),
	indication: text("indication"),
	status: text("status").notNull(),
	prescribedBy: text("prescribed_by"),
	frequency: text("frequency"),
	duration: text("duration"),
	startedAt: text("started_at"),
	clinicalNote: text("clinical_note"),
	createdBy: text("created_by"),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();
