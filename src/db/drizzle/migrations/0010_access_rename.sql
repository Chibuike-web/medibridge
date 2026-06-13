DO $$
DECLARE
	constraint_name text;
BEGIN
	SELECT conname INTO constraint_name
	FROM pg_constraint
	WHERE conrelid = 'patient_record_access_verification'::regclass
		AND contype = 'f'
		AND conkey = ARRAY[
			(
				SELECT attnum
				FROM pg_attribute
				WHERE attrelid = 'patient_record_access_verification'::regclass
					AND attname = 'access_grant_id'
			)
		];

	IF constraint_name IS NOT NULL THEN
		EXECUTE format('ALTER TABLE "patient_record_access_verification" DROP CONSTRAINT %I', constraint_name);
	END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "patient_record_access_verification" RENAME COLUMN "access_grant_id" TO "access_id";--> statement-breakpoint
ALTER TABLE "patient_record_access_grant" RENAME TO "patient_record_access";--> statement-breakpoint
ALTER TABLE "patient_record_access" DROP CONSTRAINT "patient_record_access_grant_patient_transfer_id_patient_transfer_id_fk";--> statement-breakpoint
ALTER TABLE "patient_record_access" DROP CONSTRAINT "patient_record_access_grant_patient_id_patient_id_fk";--> statement-breakpoint
ALTER TABLE "patient_record_access" DROP CONSTRAINT "patient_record_access_grant_created_by_organization_id_organization_id_fk";--> statement-breakpoint
ALTER TABLE "patient_record_access" DROP CONSTRAINT "patient_record_access_grant_created_by_user_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "patient_record_access" ADD CONSTRAINT "patient_record_access_patient_transfer_id_patient_transfer_id_fk" FOREIGN KEY ("patient_transfer_id") REFERENCES "public"."patient_transfer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_record_access" ADD CONSTRAINT "patient_record_access_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_record_access" ADD CONSTRAINT "patient_record_access_created_by_organization_id_organization_id_fk" FOREIGN KEY ("created_by_organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_record_access" ADD CONSTRAINT "patient_record_access_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_record_access_verification"
	ADD CONSTRAINT "patient_record_access_verification_access_id_patient_record_access_id_fk"
	FOREIGN KEY ("access_id")
	REFERENCES "public"."patient_record_access"("id")
	ON DELETE cascade
	ON UPDATE no action;
