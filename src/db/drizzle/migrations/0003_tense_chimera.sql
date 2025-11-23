ALTER TABLE "organization" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "hospitalDetails" DROP COLUMN "is_verified";