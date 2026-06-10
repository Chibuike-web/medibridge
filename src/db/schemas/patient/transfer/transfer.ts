import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patient } from "../patient";
import { organization } from "@/db/schemas/auth/organization";

export const patientTransfer = pgTable("patient_transfer", {
	id: text("id").primaryKey(),

	transferId: text("transfer_id").notNull().unique(),

	patientId: text("patient_id")
		.notNull()
		.references(() => patient.id, { onDelete: "cascade" }),

	sourceOrganizationId: text("source_organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	targetOrganizationId: text("target_organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	targetHospitalName: text("target_hospital_name").notNull(),

	targetHospitalAdminName: text("target_hospital_admin_name"),

	targetHospitalAdminEmail: text("target_hospital_admin_email"),

	status: text("status").notNull(),
	// pending | rejected | completed | failed | cancelled

	patientApprovalStatus: text("patient_approval_status"),
	// waiting | approved | rejected

	patientRejectionReason: text("patient_rejection_reason"),

	deliveryStatus: text("delivery_status"),
	// not_started | sent | delivered | failed

	clinicalPayloadFileName: text("clinical_payload_file_name"),

	clinicalPayloadFileUrl: text("clinical_payload_file_url"),

	clinicalPayloadFileType: text("clinical_payload_file_type"),
	// pdf

	clinicalPayloadFileSize: text("clinical_payload_file_size"),
	// 120KB

	requestedBy: text("requested_by"),

	requestedAt: timestamp("requested_at").defaultNow().notNull(),

	sentAt: timestamp("sent_at"),

	completedAt: timestamp("completed_at"),

	cancelledAt: timestamp("cancelled_at"),

	failedAt: timestamp("failed_at"),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
