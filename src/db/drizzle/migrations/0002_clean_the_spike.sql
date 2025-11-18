ALTER TABLE "hospitalDetails" ADD COLUMN "primary_contact_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "hospitalDetails" DROP COLUMN "hospital_contact_name";