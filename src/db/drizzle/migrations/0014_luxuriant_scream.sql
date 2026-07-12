CREATE TABLE "patient_document" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"title" text NOT NULL,
	"document_type" text NOT NULL,
	"clinical_notes" text,
	"files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_lab_test_file" (
	"id" text PRIMARY KEY NOT NULL,
	"lab_test_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"type" text,
	"size" text,
	"uploaded_by" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_transfer" DROP CONSTRAINT "patient_transfer_target_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "patient_transfer" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "patient_document" ADD CONSTRAINT "patient_document_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_document" ADD CONSTRAINT "patient_document_encounter_id_patient_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."patient_encounter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_lab_test_file" ADD CONSTRAINT "patient_lab_test_file_lab_test_id_patient_lab_test_id_fk" FOREIGN KEY ("lab_test_id") REFERENCES "public"."patient_lab_test"("id") ON DELETE cascade ON UPDATE no action;