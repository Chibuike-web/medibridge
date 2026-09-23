ALTER TABLE "invitation"
ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
