ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hospitalDetails" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invitation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "member" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organization" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_allergy" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_allergy_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_contact_information" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_diagnosis" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_diagnosis_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_emergency_contact" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_encounter" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_extractions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_imaging" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_imaging_file" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_imaging_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_immunization" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_immunization_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_lab_test" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_lab_test_file" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_lab_test_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_medication" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_medication_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_personal_information" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_physical_information" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_procedure" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_procedure_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_record_access" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_record_access_verification" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_transfer" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_transfer_content" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_transfer_progress" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "patient_vital" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
		REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
		REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
		ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
		ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
	END IF;
END $$;
