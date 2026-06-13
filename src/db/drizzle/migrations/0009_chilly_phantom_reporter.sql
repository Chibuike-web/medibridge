CREATE TABLE "patient_record_access_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"access_grant_id" text NOT NULL,
	"code_hash" text NOT NULL,
	"code_expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"target_hospital_admin_email" text NOT NULL,
	"target_hospital_admin_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_record_access_verification" ADD CONSTRAINT "patient_record_access_verification_access_grant_id_patient_record_access_grant_id_fk" FOREIGN KEY ("access_grant_id") REFERENCES "public"."patient_record_access_grant"("id") ON DELETE cascade ON UPDATE no action;