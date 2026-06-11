CREATE TABLE "patient_record_access_grant" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_transfer_id" text,
	"patient_id" text NOT NULL,
	"created_by_organization_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_organization_name" text,
	"status" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified_at" timestamp,
	"revoked_at" timestamp,
	"permissions" jsonb NOT NULL,
	"selected_record_ids" jsonb NOT NULL,
	"last_accessed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_record_access_grant" ADD CONSTRAINT "patient_record_access_grant_patient_transfer_id_patient_transfer_id_fk" FOREIGN KEY ("patient_transfer_id") REFERENCES "public"."patient_transfer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_record_access_grant" ADD CONSTRAINT "patient_record_access_grant_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_record_access_grant" ADD CONSTRAINT "patient_record_access_grant_created_by_organization_id_organization_id_fk" FOREIGN KEY ("created_by_organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_record_access_grant" ADD CONSTRAINT "patient_record_access_grant_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;