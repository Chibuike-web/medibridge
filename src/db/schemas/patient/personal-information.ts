import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patient } from "./patient";

export const patientPersonalInformation = pgTable("patient_personal_information", {
	id: text("id").primaryKey(),

	patientId: text("patient_id")
		.notNull()
		.unique()
		.references(() => patient.id, { onDelete: "cascade" }),

	firstName: text("first_name").notNull(),
	middleName: text("middle_name"),
	lastName: text("last_name").notNull(),

	dateOfBirth: text("date_of_birth"),
	age: integer("age"),

	sex: text("sex"),
	maritalStatus: text("marital_status"),
	nationalId: text("national_id"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
