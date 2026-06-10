CREATE TABLE "patient_lab_test" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"lab_id" text NOT NULL,
	"test_name" text NOT NULL,
	"result" text,
	"specimen" text,
	"reference_range" text,
	"interpretation" text,
	"flag" text,
	"ordered_at" timestamp,
	"ordered_by" text,
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
	CONSTRAINT "patient_lab_test_lab_id_unique" UNIQUE("lab_id")
);
--> statement-breakpoint
CREATE TABLE "patient_lab_test_history" (
	"id" text PRIMARY KEY NOT NULL,
	"lab_test_id" text NOT NULL,
	"field_name" text NOT NULL,
	"new_value" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_lab_test" ADD CONSTRAINT "patient_lab_test_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_lab_test" ADD CONSTRAINT "patient_lab_test_encounter_id_patient_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."patient_encounter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_lab_test_history" ADD CONSTRAINT "patient_lab_test_history_lab_test_id_patient_lab_test_id_fk" FOREIGN KEY ("lab_test_id") REFERENCES "public"."patient_lab_test"("id") ON DELETE cascade ON UPDATE no action;