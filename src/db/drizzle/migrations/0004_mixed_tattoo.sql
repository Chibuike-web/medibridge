CREATE TABLE "patient_imaging_history" (
	"id" text PRIMARY KEY NOT NULL,
	"imaging_id" text NOT NULL,
	"field_name" text NOT NULL,
	"new_value" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_imaging" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"imaging_id" text NOT NULL,
	"study" text NOT NULL,
	"modality" text NOT NULL,
	"region" text NOT NULL,
	"impression" text,
	"ordered_at" timestamp,
	"ordered_by" text,
	"reported_by" text,
	"status" text NOT NULL,
	"clinical_note" text,
	"file_name" text,
	"file_url" text,
	"file_type" text,
	"file_size" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patient_imaging_imaging_id_unique" UNIQUE("imaging_id")
);
--> statement-breakpoint
ALTER TABLE "patient_imaging_history" ADD CONSTRAINT "patient_imaging_history_imaging_id_patient_imaging_id_fk" FOREIGN KEY ("imaging_id") REFERENCES "public"."patient_imaging"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_imaging" ADD CONSTRAINT "patient_imaging_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_imaging" ADD CONSTRAINT "patient_imaging_encounter_id_patient_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."patient_encounter"("id") ON DELETE set null ON UPDATE no action;