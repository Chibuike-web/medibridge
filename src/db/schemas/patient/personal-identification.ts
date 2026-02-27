import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "../auth/organization";

export const patientPersonalIdentification = pgTable("patient_personal_identification", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	firstName: text("first_name").notNull(),
	middleName: text("middle_name"),
	lastName: text("last_name").notNull(),
	patientId: text("patient_id").notNull().unique(),
	age: integer("age"),
	sex: text("sex"),
	maritalStatus: text("marital_status"),
	nationalId: text("national_id"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
