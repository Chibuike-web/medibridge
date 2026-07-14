import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patientRecordAccess } from "./record-access";

export const patientRecordAccessVerification = pgTable("patient_record_access_verification", {
	id: text("id").primaryKey(),

	accessId: text("access_id")
		.notNull()
		.references(() => patientRecordAccess.id, { onDelete: "cascade" }),

	codeHash: text("code_hash").notNull(),

	codeExpiresAt: timestamp("code_expires_at").notNull(),

	consumedAt: timestamp("consumed_at"),

	attempts: integer("attempts").default(0).notNull(),

	targetHospitalEmail: text("target_hospital_email").notNull(),

	targetHospitalName: text("target_hospital_name").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),
});
