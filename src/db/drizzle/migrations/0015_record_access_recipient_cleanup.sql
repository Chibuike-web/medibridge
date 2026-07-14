ALTER TABLE "patient_transfer" ADD COLUMN IF NOT EXISTS "target_hospital_email" text;--> statement-breakpoint
UPDATE "patient_transfer" AS transfer
SET "target_hospital_email" = COALESCE(
	transfer."target_hospital_email",
	transfer."target_hospital_admin_email",
	(
		SELECT details."hospital_owner_email"
		FROM "hospitalDetails" AS details
		WHERE details."organization_id" = transfer."target_organization_id"
			OR lower(details."hospital_name") = lower(transfer."target_hospital_name")
		ORDER BY
			CASE
				WHEN details."organization_id" = transfer."target_organization_id" THEN 0
				ELSE 1
			END,
			details."id"
		LIMIT 1
	)
)
WHERE transfer."target_hospital_email" IS NULL;--> statement-breakpoint
DELETE FROM "patient_record_access" AS access
WHERE access."id" = 'ACC-DEMO-SHARED-RECORD'
	AND NOT EXISTS (
		SELECT 1
		FROM "patient_transfer" AS transfer
		WHERE transfer."id" = access."patient_transfer_id"
	);--> statement-breakpoint
ALTER TABLE "patient_record_access_verification" ADD COLUMN IF NOT EXISTS "target_hospital_email" text;--> statement-breakpoint
ALTER TABLE "patient_record_access_verification" ADD COLUMN IF NOT EXISTS "target_hospital_name" text;--> statement-breakpoint
UPDATE "patient_record_access_verification" AS verification
SET
	"target_hospital_email" = COALESCE(
		verification."target_hospital_email",
		verification."target_hospital_admin_email"
	),
	"target_hospital_name" = COALESCE(
		verification."target_hospital_name",
		transfer."target_hospital_name",
		verification."target_hospital_admin_name"
	)
FROM "patient_record_access" AS access
INNER JOIN "patient_transfer" AS transfer ON transfer."id" = access."patient_transfer_id"
WHERE verification."access_id" = access."id";--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "patient_transfer"
		WHERE "target_hospital_email" IS NULL
	) THEN
		RAISE EXCEPTION 'Cannot require patient_transfer.target_hospital_email because no trustworthy backfill exists for one or more rows';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "patient_record_access"
		WHERE "patient_transfer_id" IS NULL
	) THEN
		RAISE EXCEPTION 'Cannot require patient_record_access.patient_transfer_id while NULL values exist';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "patient_record_access" AS access
		WHERE NOT EXISTS (
			SELECT 1
			FROM "patient_transfer" AS transfer
			WHERE transfer."id" = access."patient_transfer_id"
		)
	) THEN
		RAISE EXCEPTION 'Cannot add patient_record_access.patient_transfer_id foreign key while orphaned access rows exist';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "patient_record_access_verification"
		WHERE "target_hospital_email" IS NULL
			OR "target_hospital_name" IS NULL
	) THEN
		RAISE EXCEPTION 'Cannot require record access verification recipient details while incomplete rows exist';
	END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "patient_transfer" ALTER COLUMN "target_hospital_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_transfer" DROP COLUMN IF EXISTS "target_hospital_admin_name";--> statement-breakpoint
ALTER TABLE "patient_transfer" DROP COLUMN IF EXISTS "target_hospital_admin_email";--> statement-breakpoint
ALTER TABLE "patient_record_access" DROP CONSTRAINT IF EXISTS "patient_record_access_patient_transfer_id_patient_transfer_id_fk";--> statement-breakpoint
ALTER TABLE "patient_record_access" ALTER COLUMN "patient_transfer_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_record_access" ADD CONSTRAINT "patient_record_access_patient_transfer_id_patient_transfer_id_fk" FOREIGN KEY ("patient_transfer_id") REFERENCES "public"."patient_transfer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_record_access" DROP COLUMN IF EXISTS "recipient_email";--> statement-breakpoint
ALTER TABLE "patient_record_access" DROP COLUMN IF EXISTS "recipient_organization_name";--> statement-breakpoint
ALTER TABLE "patient_record_access_verification" ALTER COLUMN "target_hospital_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_record_access_verification" ALTER COLUMN "target_hospital_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_record_access_verification" DROP COLUMN IF EXISTS "target_hospital_admin_email";--> statement-breakpoint
ALTER TABLE "patient_record_access_verification" DROP COLUMN IF EXISTS "target_hospital_admin_name";
