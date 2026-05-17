import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientTransfer } from "./transfer";

export const patientTransferProgress = pgTable("patient_transfer_progress", {
	id: text("id").primaryKey(),

	transferId: text("transfer_id")
		.notNull()
		.references(() => patientTransfer.id, { onDelete: "cascade" }),

	title: text("title").notNull(),

	description: text("description"),

	status: text("status"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});
