ALTER TABLE "hospitalDetails" DROP CONSTRAINT "hospitalDetails_primary_contact_email_unique";--> statement-breakpoint
ALTER TABLE "hospitalDetails" ADD COLUMN "hospital_owner_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "hospitalDetails" ADD COLUMN "hospital_owner_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "hospitalDetails" DROP COLUMN "primary_contact_name";--> statement-breakpoint
ALTER TABLE "hospitalDetails" DROP COLUMN "primary_contact_email";--> statement-breakpoint
ALTER TABLE "hospitalDetails" DROP COLUMN "primary_contact_phone_number";--> statement-breakpoint
ALTER TABLE "hospitalDetails" ADD CONSTRAINT "hospitalDetails_hospital_owner_email_unique" UNIQUE("hospital_owner_email");