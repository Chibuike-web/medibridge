import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { personalInformation } from "./personal-information";

export const primaryPhysician = pgTable("primary_physician", {
	id: text("id").primaryKey(),
	patientId: text("patient_id")
		.notNull()
		.references(() => personalInformation.id, { onDelete: "cascade" }),
	doctorName: text("doctor_name").notNull(),
	specialty: text("specialty"),
	facility: text("facility"),
	contactInfo: text("contact_info"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
