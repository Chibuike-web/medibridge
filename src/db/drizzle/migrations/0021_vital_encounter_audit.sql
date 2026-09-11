ALTER TABLE "patient_vital" ADD COLUMN "encounter_id" text;
--> statement-breakpoint
ALTER TABLE "patient_vital" ADD COLUMN "created_by" text;
--> statement-breakpoint
INSERT INTO "patient_encounter" (
	"id",
	"patient_id",
	"encounter_type",
	"department",
	"physician",
	"encounter_date",
	"created_by",
	"updated_by",
	"created_at",
	"updated_at"
)
SELECT
	'ENC-MIGRATED-' || "patient_id",
	"patient_id",
	'Outpatient Visit',
	'Historical records',
	'System',
	MIN("recorded_at"),
	'System',
	'System',
	MIN("created_at"),
	MIN("created_at")
FROM "patient_vital"
GROUP BY "patient_id"
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
UPDATE "patient_vital"
SET
	"encounter_id" = 'ENC-MIGRATED-' || "patient_id",
	"created_by" = 'System'
WHERE "encounter_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "patient_vital" ALTER COLUMN "encounter_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "patient_vital" ALTER COLUMN "created_by" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "patient_vital" ADD CONSTRAINT "patient_vital_encounter_id_patient_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."patient_encounter"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX "patient_vital_encounter_idx" ON "patient_vital" USING btree ("encounter_id");
