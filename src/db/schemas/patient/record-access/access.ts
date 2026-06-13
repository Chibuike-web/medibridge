import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization, user } from "@/db/schemas/auth";
import { patient } from "../patient";
import { patientTransfer } from "../transfer";

export type PatientRecordAccessPermissions = {
	medications?: boolean;
	allergies?: boolean;
	diagnoses?: boolean;
	labResults?: boolean;
	documents?: boolean;
	procedures?: boolean;
	immunizations?: boolean;
	encounters?: boolean;
	imaging?: boolean;
};

export type PatientRecordAccessSelectedRecord = {
	section: string;
	recordId: string;
};

export const patientRecordAccess = pgTable("patient_record_access", {
	id: text("id").primaryKey(),

	patientTransferId: text("patient_transfer_id").references(() => patientTransfer.id, {
		onDelete: "set null",
	}),

	patientId: text("patient_id")
		.notNull()
		.references(() => patient.id, { onDelete: "cascade" }),

	createdByOrganizationId: text("created_by_organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	createdByUserId: text("created_by_user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),

	recipientEmail: text("recipient_email").notNull(),

	recipientOrganizationName: text("recipient_organization_name"),

	status: text("status").notNull(),
	// pending | active | expired | revoked

	expiresAt: timestamp("expires_at").notNull(),

	verifiedAt: timestamp("verified_at"),

	revokedAt: timestamp("revoked_at"),

	permissions: jsonb("permissions").$type<PatientRecordAccessPermissions>().notNull(),

	selectedRecordIds: jsonb("selected_record_ids")
		.$type<PatientRecordAccessSelectedRecord[]>()
		.notNull(),

	lastAccessedAt: timestamp("last_accessed_at"),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
