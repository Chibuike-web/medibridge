CREATE TABLE "patient_vital" (
  "id" text PRIMARY KEY NOT NULL,
  "patient_id" text NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "recorded_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "systolic" integer NOT NULL,
  "diastolic" integer NOT NULL,
  "heart_rate" integer NOT NULL,
  "respiratory_rate" integer NOT NULL,
  "temperature" double precision NOT NULL,
  "oxygen_saturation" double precision NOT NULL,
  "weight" double precision NOT NULL,
  "bmi" double precision NOT NULL,
  "notes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "patient_vital_patient_recorded_idx" ON "patient_vital" ("patient_id", "recorded_at");
