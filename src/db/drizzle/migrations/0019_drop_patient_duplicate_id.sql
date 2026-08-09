DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "patient"
		WHERE "id" <> "patient_id"
	) THEN
		RAISE EXCEPTION 'Cannot remove patient.patient_id because it differs from patient.id for one or more rows';
	END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "patient" DROP COLUMN "patient_id";
