import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";
import { admin } from "better-auth/plugins/admin";
import { nextCookies } from "better-auth/next-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/auth-schema";
import { ENV } from "../utils/env";

const sql = postgres(ENV.DATABASE_URL!);
export const db = drizzle({ client: sql });

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: { enabled: true },
	session: { expiresIn: 60 * 60 * 24 * 7 },
	debug: true,
	secret: ENV.BETTER_AUTH_SECRET!,
	baseURL: ENV.BETTER_AUTH_URL,
	plugins: [
		admin(),
		organization({ creatorRole: "owner", allowUserToCreateOrganization: true }),
		nextCookies(),
	],
});
