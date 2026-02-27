import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientPersonalIdentification } from "./personal-identification";

export const patientContactInformation = pgTable("patient_contact_information", {
	id: text("id").primaryKey(),
	personalIdentificationId: text("personal_identification_id")
		.notNull()
		.unique()
		.references(() => patientPersonalIdentification.id, { onDelete: "cascade" }),
	phoneNumber: text("phone_number"),
	emailAddress: text("email_address"),
	residentialAddress: text("residential_address"),
	stateOfOrigin: text("state_of_origin"),
	countryOfOrigin: text("country_of_origin"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
