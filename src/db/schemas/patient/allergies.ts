import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { personalInformation } from "./personal-information";

export const allergies = pgTable("allergies", {
	id: text("id").primaryKey(),
	patientId: text("patient_id")
		.notNull()
		.references(() => personalInformation.id, { onDelete: "cascade" }),
	substance: text("substance").notNull(),
	reaction: text("reaction"),
	severity: text("severity"),
	recordedDate: timestamp("recorded_date"),
});
