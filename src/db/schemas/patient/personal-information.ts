import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const personalInformation = pgTable("personal_information", {
	id: text("id").primaryKey(),
	firstName: text("first_name").notNull(),
	middleName: text("middle_name"),
	lastName: text("last_name").notNull(),
	dateOfBirth: text("date_of_birth"),
	age: integer("age"),
	sex: text("sex"),
	phoneNumber: text("phone_number"),
	email: text("email"),
	residentialAddress: text("residential_address"),
	stateOfOrigin: text("state_of_origin"),
	countryOfOrigin: text("country_of_origin"),
	nationalId: text("national_id"),
	patientId: text("patient_id"),
	maritalStatus: text("marital_status"),
	bloodGroup: text("blood_group"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});
