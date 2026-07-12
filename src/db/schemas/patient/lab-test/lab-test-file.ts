import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientLabTest } from "./lab-test";

export const patientLabTestFile = pgTable("patient_lab_test_file", {
	id: text("id").primaryKey(),
	labTestId: text("lab_test_id")
		.notNull()
		.references(() => patientLabTest.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	url: text("url"),
	type: text("type"),
	size: text("size"),
	uploadedBy: text("uploaded_by"),
	uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});
