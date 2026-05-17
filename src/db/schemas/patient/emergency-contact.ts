import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patient } from "./patient";

export const patientEmergencyContact = pgTable("patient_emergency_contact", {
	id: text("id").primaryKey(),

	patientId: text("patient_id")
		.notNull()
		.unique()
		.references(() => patient.id, { onDelete: "cascade" }),

	firstName: text("first_name").notNull(),
	middleName: text("middle_name"),
	lastName: text("last_name").notNull(),

	relationship: text("relationship"),
	phoneNumber: text("phone_number"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
