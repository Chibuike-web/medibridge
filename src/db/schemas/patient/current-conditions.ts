import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { personalInformation } from "./personal-information";

export const currentConditions = pgTable("current_conditions", {
	id: text("id").primaryKey(),
	patientId: text("patient_id")
		.notNull()
		.references(() => personalInformation.id, { onDelete: "cascade" }),
	conditionName: text("condition_name").notNull(),
	status: text("status"),
	diagnosedDate: timestamp("diagnosed_date"),
	notes: text("notes"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
