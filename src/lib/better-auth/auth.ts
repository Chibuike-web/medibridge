import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";
import { admin } from "better-auth/plugins/admin";
import { nextCookies } from "better-auth/next-js";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/auth-schema";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: { enabled: true },
	session: { expiresIn: 60 * 60 * 24 * 7 },
	debug: true,
	secret: process.env.BETTER_AUTH_SECRET!,
	plugins: [admin(), organization(), nextCookies()],
});
