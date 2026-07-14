ALTER TABLE "patient_lab_test_file" DROP CONSTRAINT IF EXISTS "patient_lab_test_file_lab_test_id_patient_lab_test_id_fk";--> statement-breakpoint
ALTER TABLE "patient_lab_test_file" RENAME COLUMN "lab_test_id" TO "parent_record_id";--> statement-breakpoint
CREATE TABLE "patient_imaging_file" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_record_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"type" text,
	"size" text,
	"uploaded_by" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "patient_document_file" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_record_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"type" text,
	"size" text,
	"uploaded_by" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
INSERT INTO "patient_lab_test_file" (
	"id", "parent_record_id", "name", "url", "type", "size", "uploaded_by", "uploaded_at"
)
SELECT
	'LABFILE-' || test."id",
	test."id",
	test."file_name",
	test."file_url",
	test."file_type",
	test."file_size",
	test."updated_by",
	test."updated_at"
FROM "patient_lab_test" AS test
WHERE test."file_name" IS NOT NULL
	AND NOT EXISTS (
		SELECT 1
		FROM "patient_lab_test_file" AS file
		WHERE file."parent_record_id" = test."id"
	);--> statement-breakpoint
INSERT INTO "patient_imaging_file" (
	"id", "parent_record_id", "name", "url", "type", "size", "uploaded_by", "uploaded_at"
)
SELECT
	'IMGFILE-' || imaging."id",
	imaging."id",
	imaging."file_name",
	imaging."file_url",
	imaging."file_type",
	imaging."file_size",
	COALESCE(imaging."updated_by", imaging."created_by"),
	imaging."updated_at"
FROM "patient_imaging" AS imaging
WHERE imaging."file_name" IS NOT NULL;--> statement-breakpoint
INSERT INTO "patient_document_file" (
	"id", "parent_record_id", "name", "url", "type", "size", "uploaded_by", "uploaded_at"
)
SELECT
	'DOCFILE-' || document."id" || '-' || file.ordinality,
	document."id",
	file.value->>'name',
	file.value->>'url',
	file.value->>'type',
	file.value->>'size',
	document."created_by",
	COALESCE(NULLIF(file.value->>'uploadedAt', '')::timestamp, document."created_at")
FROM "patient_document" AS document
CROSS JOIN LATERAL jsonb_array_elements(document."files") WITH ORDINALITY AS file(value, ordinality)
WHERE file.value->>'name' IS NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_lab_test_file" ADD CONSTRAINT "patient_lab_test_file_parent_fk" FOREIGN KEY ("parent_record_id") REFERENCES "public"."patient_lab_test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_imaging_file" ADD CONSTRAINT "patient_imaging_file_parent_fk" FOREIGN KEY ("parent_record_id") REFERENCES "public"."patient_imaging"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_document_file" ADD CONSTRAINT "patient_document_file_parent_fk" FOREIGN KEY ("parent_record_id") REFERENCES "public"."patient_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "patient_lab_test_file_parent_record_id_idx" ON "patient_lab_test_file" USING btree ("parent_record_id");--> statement-breakpoint
CREATE INDEX "patient_imaging_file_parent_record_id_idx" ON "patient_imaging_file" USING btree ("parent_record_id");--> statement-breakpoint
CREATE INDEX "patient_document_file_parent_record_id_idx" ON "patient_document_file" USING btree ("parent_record_id");--> statement-breakpoint
ALTER TABLE "patient_lab_test" DROP COLUMN "file_name";--> statement-breakpoint
ALTER TABLE "patient_lab_test" DROP COLUMN "file_url";--> statement-breakpoint
ALTER TABLE "patient_lab_test" DROP COLUMN "file_type";--> statement-breakpoint
ALTER TABLE "patient_lab_test" DROP COLUMN "file_size";--> statement-breakpoint
ALTER TABLE "patient_imaging" DROP COLUMN "file_name";--> statement-breakpoint
ALTER TABLE "patient_imaging" DROP COLUMN "file_url";--> statement-breakpoint
ALTER TABLE "patient_imaging" DROP COLUMN "file_type";--> statement-breakpoint
ALTER TABLE "patient_imaging" DROP COLUMN "file_size";--> statement-breakpoint
ALTER TABLE "patient_document" DROP COLUMN "files";
