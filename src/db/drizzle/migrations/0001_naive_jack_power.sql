ALTER TABLE "patient_contact_information" DROP CONSTRAINT "patient_contact_information_patient_personal_identification_id_unique";--> statement-breakpoint
ALTER TABLE "patient_emergency_contact" DROP CONSTRAINT "patient_emergency_contact_patient_personal_identification_id_unique";--> statement-breakpoint
ALTER TABLE "patient_physical_information" DROP CONSTRAINT "patient_physical_information_patient_personal_identification_id_unique";--> statement-breakpoint
ALTER TABLE "patient_contact_information" DROP CONSTRAINT "patient_contact_info_personal_identification_fk";
--> statement-breakpoint
ALTER TABLE "patient_emergency_contact" DROP CONSTRAINT "patient_emergency_contact_personal_identification_fk";
--> statement-breakpoint
ALTER TABLE "patient_physical_information" DROP CONSTRAINT "patient_physical_info_personal_identification_fk";
--> statement-breakpoint
ALTER TABLE "patient_contact_information" ADD COLUMN "personal_identification_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_emergency_contact" ADD COLUMN "personal_identification_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_physical_information" ADD COLUMN "personal_identification_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_contact_information" ADD CONSTRAINT "patient_contact_information_personal_identification_id_patient_personal_identification_id_fk" FOREIGN KEY ("personal_identification_id") REFERENCES "public"."patient_personal_identification"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_emergency_contact" ADD CONSTRAINT "patient_emergency_contact_personal_identification_id_patient_personal_identification_id_fk" FOREIGN KEY ("personal_identification_id") REFERENCES "public"."patient_personal_identification"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_physical_information" ADD CONSTRAINT "patient_physical_information_personal_identification_id_patient_personal_identification_id_fk" FOREIGN KEY ("personal_identification_id") REFERENCES "public"."patient_personal_identification"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_contact_information" DROP COLUMN "patient_personal_identification_id";--> statement-breakpoint
ALTER TABLE "patient_emergency_contact" DROP COLUMN "patient_personal_identification_id";--> statement-breakpoint
ALTER TABLE "patient_physical_information" DROP COLUMN "patient_personal_identification_id";--> statement-breakpoint
ALTER TABLE "patient_contact_information" ADD CONSTRAINT "patient_contact_information_personal_identification_id_unique" UNIQUE("personal_identification_id");--> statement-breakpoint
ALTER TABLE "patient_emergency_contact" ADD CONSTRAINT "patient_emergency_contact_personal_identification_id_unique" UNIQUE("personal_identification_id");--> statement-breakpoint
ALTER TABLE "patient_physical_information" ADD CONSTRAINT "patient_physical_information_personal_identification_id_unique" UNIQUE("personal_identification_id");