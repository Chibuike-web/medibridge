import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "../auth/organization";

export const hospitalDetails = pgTable("hospitalDetails", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	hospitalName: text("hospital_name").notNull(),
	hospitalAddress: text("hospital_address").notNull(),
	hospitalOwnerName: text("hospital_owner_name").notNull(),
	hospitalOwnerEmail: text("hospital_owner_email").notNull().unique(),
	documentPath: text("document_path"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
