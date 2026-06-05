CREATE TABLE "patient_allergy_history" (
	"id" text PRIMARY KEY NOT NULL,
	"allergy_id" text NOT NULL,
	"field_name" text NOT NULL,
	"new_value" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_allergy" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"encounter_id" text,
	"allergy_id" text NOT NULL,
	"allergen" text NOT NULL,
	"reaction" text NOT NULL,
	"severity" text NOT NULL,
	"status" text NOT NULL,
	"clinical_note" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patient_allergy_allergy_id_unique" UNIQUE("allergy_id")
);
--> statement-breakpoint
ALTER TABLE "patient_diagnosis" ADD COLUMN "last_reviewed_at" text;--> statement-breakpoint
ALTER TABLE "patient_allergy_history" ADD CONSTRAINT "patient_allergy_history_allergy_id_patient_allergy_id_fk" FOREIGN KEY ("allergy_id") REFERENCES "public"."patient_allergy"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_allergy" ADD CONSTRAINT "patient_allergy_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_allergy" ADD CONSTRAINT "patient_allergy_encounter_id_patient_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."patient_encounter"("id") ON DELETE set null ON UPDATE no action;