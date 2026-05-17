import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientTransfer } from "./transfer";

export const patientTransferContent = pgTable("patient_transfer_content", {
	id: text("id").primaryKey(),

	transferId: text("transfer_id")
		.notNull()
		.references(() => patientTransfer.id, { onDelete: "cascade" }),

	contentType: text("content_type").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});
