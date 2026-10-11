import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "../auth";
import type { PatientRecord } from "@/features/patients/schemas/patient-schema";

export type PatientExtractionRecord = PatientRecord & { documentId: string };

export const patientExtraction = pgTable(
	"patient_extractions",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		createdBy: text("created_by").notNull(),
		extractedData: jsonb("extracted_data").$type<PatientExtractionRecord[]>().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("patient_extractions_organization_created_idx").on(table.organizationId, table.createdAt),
	],
);
