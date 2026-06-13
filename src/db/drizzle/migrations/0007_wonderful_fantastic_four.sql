ALTER TABLE "patient_transfer_content" ADD COLUMN "record_id" text;--> statement-breakpoint
UPDATE "patient_transfer_content"
SET "record_id" = upper(left("content_type", 3)) || '-' || "id"
WHERE "record_id" IS NULL;--> statement-breakpoint
ALTER TABLE "patient_transfer_content" ALTER COLUMN "record_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_transfer" DROP COLUMN "clinical_payload_file_name";--> statement-breakpoint
ALTER TABLE "patient_transfer" DROP COLUMN "clinical_payload_file_url";--> statement-breakpoint
ALTER TABLE "patient_transfer" DROP COLUMN "clinical_payload_file_type";--> statement-breakpoint
ALTER TABLE "patient_transfer" DROP COLUMN "clinical_payload_file_size";
