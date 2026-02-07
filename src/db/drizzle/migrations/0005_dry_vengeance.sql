CREATE TABLE "allergies" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"substance" text NOT NULL,
	"reaction" text,
	"severity" text,
	"recorded_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"file_url" text NOT NULL,
	"file_type" text,
	"category" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "current_conditions" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"condition_name" text NOT NULL,
	"status" text,
	"diagnosed_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "current_medications" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"drug_name" text NOT NULL,
	"dosage" text,
	"frequency" text,
	"route" text,
	"prescribed_by" text,
	"start_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_contact" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"relationship" text,
	"phone_primary" text,
	"phone_secondary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_information" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"date_of_birth" text,
	"age" integer,
	"sex" text,
	"phone_number" text,
	"email" text,
	"residential_address" text,
	"state_of_origin" text,
	"country_of_origin" text,
	"national_id" text,
	"patient_id" text,
	"marital_status" text,
	"blood_group" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_information" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"height" text,
	"weight" text,
	"bmi" text,
	"blood_pressure" text,
	"last_medical_review" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "primary_physician" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"doctor_name" text NOT NULL,
	"specialty" text,
	"facility" text,
	"contact_info" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_patient_id_personal_information_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."personal_information"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_patient_id_personal_information_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."personal_information"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "current_conditions" ADD CONSTRAINT "current_conditions_patient_id_personal_information_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."personal_information"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "current_medications" ADD CONSTRAINT "current_medications_patient_id_personal_information_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."personal_information"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_information" ADD CONSTRAINT "medical_information_patient_id_personal_information_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."personal_information"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "primary_physician" ADD CONSTRAINT "primary_physician_patient_id_personal_information_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."personal_information"("id") ON DELETE cascade ON UPDATE no action;