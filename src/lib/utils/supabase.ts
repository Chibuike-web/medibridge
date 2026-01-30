import { createClient } from "@supabase/supabase-js";
import z from "zod";

const envSchema = z.object({
	SUPABASE_URL: z.url(),
	SUPABASE_SERVICE_ROLE_KEY: z.string(),
});

const ENV = envSchema.parse({
	SUPABASE_URL: process.env.SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

export const supabase = createClient(ENV.SUPABASE_URL!, ENV.SUPABASE_SERVICE_ROLE_KEY!);
