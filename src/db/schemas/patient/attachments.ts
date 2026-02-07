import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { personalInformation } from "./personal-information";

export const attachments = pgTable("attachments", {
	id: text("id").primaryKey(),
	patientId: text("patient_id")
		.notNull()
		.references(() => personalInformation.id, { onDelete: "cascade" }),
	fileUrl: text("file_url").notNull(),
	fileType: text("file_type"),
	category: text("category"),
	uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});
