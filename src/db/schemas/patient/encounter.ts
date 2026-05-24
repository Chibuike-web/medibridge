import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patient } from "./patient";

export const patientEncounter = pgTable("patient_encounter", {
	id: text("id").primaryKey(),
	patientId: text("patient_id")
		.notNull()
		.references(() => patient.id, { onDelete: "cascade" }),
	encounterId: text("encounter_id").notNull(),
	encounterType: text("encounter_type").notNull(),
	department: text("department").notNull(),
	physician: text("physician").notNull(),
	encounterDate: timestamp("encounter_date").notNull(),
	createdBy: text("created_by").notNull(),
	updatedBy: text("updated_by").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
