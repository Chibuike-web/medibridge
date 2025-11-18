CREATE TABLE "hospitalDetails" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"hospital_name" text NOT NULL,
	"hospital_address" text NOT NULL,
	"hospital_contact_name" text NOT NULL,
	"primary_contact_email" text NOT NULL,
	"primary_contact_phone_number" text NOT NULL,
	"document_path" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hospitalDetails_primary_contact_email_unique" UNIQUE("primary_contact_email")
);
--> statement-breakpoint
ALTER TABLE "hospitalDetails" ADD CONSTRAINT "hospitalDetails_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;