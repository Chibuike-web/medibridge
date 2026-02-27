import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientPersonalIdentification } from "./personal-identification";

export const patientPhysicalInformation = pgTable("patient_physical_information", {
	id: text("id").primaryKey(),
	personalIdentificationId: text("personal_identification_id")
		.notNull()
		.unique()
		.references(() => patientPersonalIdentification.id, { onDelete: "cascade" }),
	height: text("height"),
	weight: text("weight"),
	bloodGroup: text("blood_group"),
	genotype: text("genotype"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
