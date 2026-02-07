import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const emergencyContact = pgTable("emergency_contact", {
	id: text("id").primaryKey(),
	firstName: text("first_name").notNull(),
	middleName: text("middle_name"),
	lastName: text("last_name").notNull(),
	relationship: text("relationship"),
	phonePrimary: text("phone_primary"),
	phoneSecondary: text("phone_secondary"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});
