import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";
import { admin } from "better-auth/plugins/admin";
import { nextCookies } from "better-auth/next-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schemas/auth";
import { ENV } from "../utils/env";
import { sendEmail } from "../utils/send-email";

// const sql = postgres(ENV.DATABASE_URL!);
const globalForDb = globalThis as unknown as {
	sql: ReturnType<typeof postgres> | undefined;
};

export const sql =
	globalForDb.sql ??
	postgres(ENV.DATABASE_URL!, {
		max: 1,
		idle_timeout: 20,
		connect_timeout: 10,
	});

if (process.env.NODE_ENV !== "production") {
	globalForDb.sql = sql;
}

export const db = drizzle({ client: sql });

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: { enabled: true },
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			console.log(user);
			console.log("Verification URL:", url);
			const data = await sendEmail(user.email, url);
			console.log(data);
		},
	},
	user: { deleteUser: { enabled: true } },
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		cookieCache: {
			enabled: true,
			maxAge: 60,
		},
	},
	debug: true,
	secret: ENV.BETTER_AUTH_SECRET!,
	baseURL: ENV.BETTER_AUTH_URL,
	plugins: [
		admin(),
		organization({ creatorRole: "owner", allowUserToCreateOrganization: true }),
		nextCookies(),
	],
});
