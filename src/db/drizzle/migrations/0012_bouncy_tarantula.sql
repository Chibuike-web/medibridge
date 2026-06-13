ALTER TABLE "patient_allergy_history" DROP CONSTRAINT "patient_allergy_history_allergy_id_patient_allergy_id_fk";--> statement-breakpoint
ALTER TABLE "patient_imaging_history" DROP CONSTRAINT "patient_imaging_history_imaging_id_patient_imaging_id_fk";--> statement-breakpoint
ALTER TABLE "patient_immunization_history" DROP CONSTRAINT "patient_immunization_history_immunization_id_patient_immunization_id_fk";--> statement-breakpoint
ALTER TABLE "patient_medication_history" DROP CONSTRAINT "patient_medication_history_medication_id_patient_medication_id_fk";--> statement-breakpoint
ALTER TABLE "patient_procedure_history" DROP CONSTRAINT "patient_procedure_history_procedure_id_patient_procedure_id_fk";--> statement-breakpoint
ALTER TABLE "patient_lab_test_history" DROP CONSTRAINT "patient_lab_test_history_lab_test_id_patient_lab_test_id_fk";--> statement-breakpoint
ALTER TABLE "patient_diagnosis" DROP CONSTRAINT "patient_diagnosis_encounter_id_patient_encounter_id_fk";--> statement-breakpoint
ALTER TABLE "patient_allergy" DROP CONSTRAINT "patient_allergy_encounter_id_patient_encounter_id_fk";--> statement-breakpoint
ALTER TABLE "patient_imaging" DROP CONSTRAINT "patient_imaging_encounter_id_patient_encounter_id_fk";--> statement-breakpoint
ALTER TABLE "patient_immunization" DROP CONSTRAINT "patient_immunization_encounter_id_patient_encounter_id_fk";--> statement-breakpoint
ALTER TABLE "patient_medication" DROP CONSTRAINT "patient_medication_encounter_id_patient_encounter_id_fk";--> statement-breakpoint
ALTER TABLE "patient_procedure" DROP CONSTRAINT "patient_procedure_encounter_id_patient_encounter_id_fk";--> statement-breakpoint
ALTER TABLE "patient_lab_test" DROP CONSTRAINT "patient_lab_test_encounter_id_patient_encounter_id_fk";--> statement-breakpoint
UPDATE "patient_transfer_content"
SET "record_id" = "patient_allergy"."allergy_id"
FROM "patient_allergy"
WHERE "patient_transfer_content"."record_id" = "patient_allergy"."id"
	AND "patient_transfer_content"."content_type" IN ('allergies', 'allergy');--> statement-breakpoint
UPDATE "patient_transfer_content"
SET "record_id" = "patient_imaging"."imaging_id"
FROM "patient_imaging"
WHERE "patient_transfer_content"."record_id" = "patient_imaging"."id"
	AND "patient_transfer_content"."content_type" = 'imaging';--> statement-breakpoint
UPDATE "patient_transfer_content"
SET "record_id" = "patient_immunization"."immunization_id"
FROM "patient_immunization"
WHERE "patient_transfer_content"."record_id" = "patient_immunization"."id"
	AND "patient_transfer_content"."content_type" IN ('immunizations', 'immunization');--> statement-breakpoint
UPDATE "patient_transfer_content"
SET "record_id" = "patient_medication"."medication_id"
FROM "patient_medication"
WHERE "patient_transfer_content"."record_id" = "patient_medication"."id"
	AND "patient_transfer_content"."content_type" = 'medications';--> statement-breakpoint
UPDATE "patient_transfer_content"
SET "record_id" = "patient_procedure"."procedure_id"
FROM "patient_procedure"
WHERE "patient_transfer_content"."record_id" = "patient_procedure"."id"
	AND "patient_transfer_content"."content_type" = 'procedures';--> statement-breakpoint
UPDATE "patient_transfer_content"
SET "record_id" = "patient_lab_test"."lab_id"
FROM "patient_lab_test"
WHERE "patient_transfer_content"."record_id" = "patient_lab_test"."id"
	AND "patient_transfer_content"."content_type" IN ('lab-tests', 'labs');--> statement-breakpoint
UPDATE "patient_transfer_content"
SET "record_id" = "patient_encounter"."encounter_id"
FROM "patient_encounter"
WHERE "patient_transfer_content"."record_id" = "patient_encounter"."id"
	AND "patient_transfer_content"."content_type" = 'encounters';--> statement-breakpoint
UPDATE "patient_record_access"
SET "selected_record_ids" = COALESCE((
	SELECT jsonb_agg(
		CASE
			WHEN selected_record ->> 'section' = 'allergies'
				AND "patient_allergy"."allergy_id" IS NOT NULL
				THEN jsonb_set(selected_record, '{recordId}', to_jsonb("patient_allergy"."allergy_id"))
			ELSE selected_record
		END
	)
	FROM jsonb_array_elements("patient_record_access"."selected_record_ids") AS selected_record
	LEFT JOIN "patient_allergy" ON selected_record ->> 'recordId' = "patient_allergy"."id"
), '[]'::jsonb);--> statement-breakpoint
UPDATE "patient_record_access"
SET "selected_record_ids" = COALESCE((
	SELECT jsonb_agg(
		CASE
			WHEN selected_record ->> 'section' = 'imaging'
				AND "patient_imaging"."imaging_id" IS NOT NULL
				THEN jsonb_set(selected_record, '{recordId}', to_jsonb("patient_imaging"."imaging_id"))
			ELSE selected_record
		END
	)
	FROM jsonb_array_elements("patient_record_access"."selected_record_ids") AS selected_record
	LEFT JOIN "patient_imaging" ON selected_record ->> 'recordId' = "patient_imaging"."id"
), '[]'::jsonb);--> statement-breakpoint
UPDATE "patient_record_access"
SET "selected_record_ids" = COALESCE((
	SELECT jsonb_agg(
		CASE
			WHEN selected_record ->> 'section' IN ('immunizations', 'immunization')
				AND "patient_immunization"."immunization_id" IS NOT NULL
				THEN jsonb_set(selected_record, '{recordId}', to_jsonb("patient_immunization"."immunization_id"))
			ELSE selected_record
		END
	)
	FROM jsonb_array_elements("patient_record_access"."selected_record_ids") AS selected_record
	LEFT JOIN "patient_immunization" ON selected_record ->> 'recordId' = "patient_immunization"."id"
), '[]'::jsonb);--> statement-breakpoint
UPDATE "patient_record_access"
SET "selected_record_ids" = COALESCE((
	SELECT jsonb_agg(
		CASE
			WHEN selected_record ->> 'section' = 'medications'
				AND "patient_medication"."medication_id" IS NOT NULL
				THEN jsonb_set(selected_record, '{recordId}', to_jsonb("patient_medication"."medication_id"))
			ELSE selected_record
		END
	)
	FROM jsonb_array_elements("patient_record_access"."selected_record_ids") AS selected_record
	LEFT JOIN "patient_medication" ON selected_record ->> 'recordId' = "patient_medication"."id"
), '[]'::jsonb);--> statement-breakpoint
UPDATE "patient_record_access"
SET "selected_record_ids" = COALESCE((
	SELECT jsonb_agg(
		CASE
			WHEN selected_record ->> 'section' = 'procedures'
				AND "patient_procedure"."procedure_id" IS NOT NULL
				THEN jsonb_set(selected_record, '{recordId}', to_jsonb("patient_procedure"."procedure_id"))
			ELSE selected_record
		END
	)
	FROM jsonb_array_elements("patient_record_access"."selected_record_ids") AS selected_record
	LEFT JOIN "patient_procedure" ON selected_record ->> 'recordId' = "patient_procedure"."id"
), '[]'::jsonb);--> statement-breakpoint
UPDATE "patient_record_access"
SET "selected_record_ids" = COALESCE((
	SELECT jsonb_agg(
		CASE
			WHEN selected_record ->> 'section' IN ('lab-tests', 'labs')
				AND "patient_lab_test"."lab_id" IS NOT NULL
				THEN jsonb_set(selected_record, '{recordId}', to_jsonb("patient_lab_test"."lab_id"))
			ELSE selected_record
		END
	)
	FROM jsonb_array_elements("patient_record_access"."selected_record_ids") AS selected_record
	LEFT JOIN "patient_lab_test" ON selected_record ->> 'recordId' = "patient_lab_test"."id"
), '[]'::jsonb);--> statement-breakpoint
UPDATE "patient_record_access"
SET "selected_record_ids" = COALESCE((
	SELECT jsonb_agg(
		CASE
			WHEN selected_record ->> 'section' = 'encounters'
				AND "patient_encounter"."encounter_id" IS NOT NULL
				THEN jsonb_set(selected_record, '{recordId}', to_jsonb("patient_encounter"."encounter_id"))
			ELSE selected_record
		END
	)
	FROM jsonb_array_elements("patient_record_access"."selected_record_ids") AS selected_record
	LEFT JOIN "patient_encounter" ON selected_record ->> 'recordId' = "patient_encounter"."id"
), '[]'::jsonb);--> statement-breakpoint
UPDATE "patient_allergy_history"
SET "allergy_id" = "patient_allergy"."allergy_id"
FROM "patient_allergy"
WHERE "patient_allergy_history"."allergy_id" = "patient_allergy"."id";--> statement-breakpoint
UPDATE "patient_imaging_history"
SET "imaging_id" = "patient_imaging"."imaging_id"
FROM "patient_imaging"
WHERE "patient_imaging_history"."imaging_id" = "patient_imaging"."id";--> statement-breakpoint
UPDATE "patient_immunization_history"
SET "immunization_id" = "patient_immunization"."immunization_id"
FROM "patient_immunization"
WHERE "patient_immunization_history"."immunization_id" = "patient_immunization"."id";--> statement-breakpoint
UPDATE "patient_medication_history"
SET "medication_id" = "patient_medication"."medication_id"
FROM "patient_medication"
WHERE "patient_medication_history"."medication_id" = "patient_medication"."id";--> statement-breakpoint
UPDATE "patient_procedure_history"
SET "procedure_id" = "patient_procedure"."procedure_id"
FROM "patient_procedure"
WHERE "patient_procedure_history"."procedure_id" = "patient_procedure"."id";--> statement-breakpoint
UPDATE "patient_lab_test_history"
SET "lab_test_id" = "patient_lab_test"."lab_id"
FROM "patient_lab_test"
WHERE "patient_lab_test_history"."lab_test_id" = "patient_lab_test"."id";--> statement-breakpoint
UPDATE "patient_diagnosis"
SET "encounter_id" = "patient_encounter"."encounter_id"
FROM "patient_encounter"
WHERE "patient_diagnosis"."encounter_id" = "patient_encounter"."id";--> statement-breakpoint
UPDATE "patient_allergy"
SET "encounter_id" = "patient_encounter"."encounter_id"
FROM "patient_encounter"
WHERE "patient_allergy"."encounter_id" = "patient_encounter"."id";--> statement-breakpoint
UPDATE "patient_imaging"
SET "encounter_id" = "patient_encounter"."encounter_id"
FROM "patient_encounter"
WHERE "patient_imaging"."encounter_id" = "patient_encounter"."id";--> statement-breakpoint
UPDATE "patient_immunization"
SET "encounter_id" = "patient_encounter"."encounter_id"
FROM "patient_encounter"
WHERE "patient_immunization"."encounter_id" = "patient_encounter"."id";--> statement-breakpoint
UPDATE "patient_medication"
SET "encounter_id" = "patient_encounter"."encounter_id"
FROM "patient_encounter"
WHERE "patient_medication"."encounter_id" = "patient_encounter"."id";--> statement-breakpoint
UPDATE "patient_procedure"
SET "encounter_id" = "patient_encounter"."encounter_id"
FROM "patient_encounter"
WHERE "patient_procedure"."encounter_id" = "patient_encounter"."id";--> statement-breakpoint
UPDATE "patient_lab_test"
SET "encounter_id" = "patient_encounter"."encounter_id"
FROM "patient_encounter"
WHERE "patient_lab_test"."encounter_id" = "patient_encounter"."id";--> statement-breakpoint
UPDATE "patient_allergy" SET "id" = "allergy_id";--> statement-breakpoint
UPDATE "patient_imaging" SET "id" = "imaging_id";--> statement-breakpoint
UPDATE "patient_immunization" SET "id" = "immunization_id";--> statement-breakpoint
UPDATE "patient_medication" SET "id" = "medication_id";--> statement-breakpoint
UPDATE "patient_procedure" SET "id" = "procedure_id";--> statement-breakpoint
UPDATE "patient_lab_test" SET "id" = "lab_id";--> statement-breakpoint
UPDATE "patient_encounter" SET "id" = "encounter_id";--> statement-breakpoint
ALTER TABLE "patient_allergy" DROP CONSTRAINT "patient_allergy_allergy_id_unique";--> statement-breakpoint
ALTER TABLE "patient_imaging" DROP CONSTRAINT "patient_imaging_imaging_id_unique";--> statement-breakpoint
ALTER TABLE "patient_immunization" DROP CONSTRAINT "patient_immunization_immunization_id_unique";--> statement-breakpoint
ALTER TABLE "patient_medication" DROP CONSTRAINT "patient_medication_medication_id_unique";--> statement-breakpoint
ALTER TABLE "patient_procedure" DROP CONSTRAINT "patient_procedure_procedure_id_unique";--> statement-breakpoint
ALTER TABLE "patient_lab_test" DROP CONSTRAINT "patient_lab_test_lab_id_unique";--> statement-breakpoint
ALTER TABLE "patient_allergy" DROP COLUMN "allergy_id";--> statement-breakpoint
ALTER TABLE "patient_encounter" DROP COLUMN "encounter_id";--> statement-breakpoint
ALTER TABLE "patient_imaging" DROP COLUMN "imaging_id";--> statement-breakpoint
ALTER TABLE "patient_immunization" DROP COLUMN "immunization_id";--> statement-breakpoint
ALTER TABLE "patient_medication" DROP COLUMN "medication_id";--> statement-breakpoint
ALTER TABLE "patient_procedure" DROP COLUMN "procedure_id";--> statement-breakpoint
ALTER TABLE "patient_lab_test" DROP COLUMN "lab_id";--> statement-breakpoint
ALTER TABLE "patient_allergy_history" ADD CONSTRAINT "patient_allergy_history_allergy_id_patient_allergy_id_fk" FOREIGN KEY ("allergy_id") REFERENCES "public"."patient_allergy"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_imaging_history" ADD CONSTRAINT "patient_imaging_history_imaging_id_patient_imaging_id_fk" FOREIGN KEY ("imaging_id") REFERENCES "public"."patient_imaging"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_immunization_history" ADD CONSTRAINT "patient_immunization_history_immunization_id_patient_immunization_id_fk" FOREIGN KEY ("immunization_id") REFERENCES "public"."patient_immunization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_medication_history" ADD CONSTRAINT "patient_medication_history_medication_id_patient_medication_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."patient_medication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_procedure_history" ADD CONSTRAINT "patient_procedure_history_procedure_id_patient_procedure_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."patient_procedure"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_lab_test_history" ADD CONSTRAINT "patient_lab_test_history_lab_test_id_patient_lab_test_id_fk" FOREIGN KEY ("lab_test_id") REFERENCES "public"."patient_lab_test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_diagnosis" ADD CONSTRAINT "patient_diagnosis_encounter_id_patient_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."patient_encounter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_allergy" ADD CONSTRAINT "patient_allergy_encounter_id_patient_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."patient_encounter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_imaging" ADD CONSTRAINT "patient_imaging_encounter_id_patient_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."patient_encounter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_immunization" ADD CONSTRAINT "patient_immunization_encounter_id_patient_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."patient_encounter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_medication" ADD CONSTRAINT "patient_medication_encounter_id_patient_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."patient_encounter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_procedure" ADD CONSTRAINT "patient_procedure_encounter_id_patient_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."patient_encounter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_lab_test" ADD CONSTRAINT "patient_lab_test_encounter_id_patient_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."patient_encounter"("id") ON DELETE set null ON UPDATE no action;
