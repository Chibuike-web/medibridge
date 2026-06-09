CREATE TABLE "patient_immunization_history" (
	"id" text PRIMARY KEY NOT NULL,
	"immunization_id" text NOT NULL,
	"field_name" text NOT NULL,
	"new_value" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_immunization" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"immunization_id" text NOT NULL,
	"vaccine_name" text NOT NULL,
	"current_dose" text,
	"total_doses" text,
	"series_type" text,
	"date_administered" timestamp,
	"administered_by" text,
	"status" text NOT NULL,
	"clinical_note" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patient_immunization_immunization_id_unique" UNIQUE("immunization_id")
);
--> statement-breakpoint
ALTER TABLE "patient_immunization_history" ADD CONSTRAINT "patient_immunization_history_immunization_id_patient_immunization_id_fk" FOREIGN KEY ("immunization_id") REFERENCES "public"."patient_immunization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_immunization" ADD CONSTRAINT "patient_immunization_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_immunization" ADD CONSTRAINT "patient_immunization_encounter_id_patient_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."patient_encounter"("id") ON DELETE set null ON UPDATE no action;