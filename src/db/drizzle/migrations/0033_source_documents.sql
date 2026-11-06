CREATE TABLE "patient_source_document" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"name" text NOT NULL,
	"storage_key" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patient_source_document_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
ALTER TABLE "patient_source_document" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "patient_source_document" ADD CONSTRAINT "patient_source_document_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "patient_source_document_patient_id_idx" ON "patient_source_document" USING btree ("patient_id");
--> statement-breakpoint
UPDATE "patient_extractions" SET "extracted_data" = (
	SELECT jsonb_agg(
		CASE
			WHEN "document"->>'fileName' IS NULL
				THEN "document" || jsonb_build_object('fileName', "document"->>'documentId')
			ELSE "document"
		END
		ORDER BY "position"
	)
	FROM jsonb_array_elements("extracted_data") WITH ORDINALITY AS "documents"("document", "position")
)
WHERE EXISTS (
	SELECT 1 FROM jsonb_array_elements("extracted_data") AS "documents"("document")
	WHERE "document"->>'fileName' IS NULL
);
