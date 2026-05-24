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
	medicationId: text("medication_id").notNull().unique(),
	indication: text("indication"),
	status: text("status").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
