ALTER TABLE "patient_transfer" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "patient_transfer" ADD COLUMN "updated_by" text;--> statement-breakpoint
UPDATE "patient_transfer"
SET
	"created_by" = "requested_by",
	"updated_by" = "requested_by"
WHERE "requested_by" IS NOT NULL;
