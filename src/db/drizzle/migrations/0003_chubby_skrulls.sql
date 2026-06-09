CREATE TABLE "patient_procedure" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"procedure_id" text NOT NULL,
	"procedure_name" text NOT NULL,
	"indication" text,
	"facility" text,
	"status" text NOT NULL,
	"procedure_date" timestamp,
	"performed_by" text,
	"assistants" text,
	"planned_date" timestamp,
	"planned_physician" text,
	"planned_assistants" text,
	"planned_facility" text,
	"diagnosis_id" text,
	"medication_id" text,
	"clinical_note" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patient_procedure_procedure_id_unique" UNIQUE("procedure_id")
);
--> statement-breakpoint
CREATE TABLE "patient_procedure_history" (
	"id" text PRIMARY KEY NOT NULL,
	"procedure_id" text NOT NULL,
	"field_name" text NOT NULL,
	"new_value" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_procedure" ADD CONSTRAINT "patient_procedure_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_procedure" ADD CONSTRAINT "patient_procedure_encounter_id_patient_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."patient_encounter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_procedure_history" ADD CONSTRAINT "patient_procedure_history_procedure_id_patient_procedure_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."patient_procedure"("id") ON DELETE cascade ON UPDATE no action;