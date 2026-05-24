import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "../auth";

export const patient = pgTable("patient", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	patientId: text("patient_id").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
