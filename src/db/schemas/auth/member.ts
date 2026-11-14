import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { user } from "./user";

export const member = pgTable("member", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.unique("member_user_id_unique")
		.references(() => user.id, { onDelete: "cascade" }),
	role: text("role").default("member").notNull(),
	staffType: text("staff_type"),
	departments: text("departments").array(),
	permissions: text("permissions").array().default([]).notNull(),
	mcpScopes: text("mcp_scopes").array().default([]).notNull(),
	createdAt: timestamp("created_at").notNull(),
}).enableRLS();
