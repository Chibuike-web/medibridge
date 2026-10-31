import "server-only";

import { supabase } from "@/lib/utils/supabase";

export const patientUploads = supabase.storage.from("patient-uploads");
export const hospitalUploads = supabase.storage.from("hospital-uploads");
