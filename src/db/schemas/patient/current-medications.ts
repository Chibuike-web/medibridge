import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { personalInformation } from "./personal-information";

export const currentMedications = pgTable("current_medications", {
	id: text("id").primaryKey(),
	patientId: text("patient_id")
		.notNull()
		.references(() => personalInformation.id, { onDelete: "cascade" }),
	drugName: text("drug_name").notNull(),
	dosage: text("dosage"),
	frequency: text("frequency"),
	route: text("route"),
	prescribedBy: text("prescribed_by"),
	startDate: timestamp("start_date"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
