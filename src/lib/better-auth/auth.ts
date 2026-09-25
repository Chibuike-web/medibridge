import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";
import { admin } from "better-auth/plugins/admin";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schemas/auth";
import { ENV } from "../utils/env";
import { sendEmail, sendPasswordResetEmail } from "../utils/send-email";
import { and, eq } from "drizzle-orm";
import {
	assertAccountCanBeDeleted,
	assertCanJoinHospital,
	assertInvitationAllowed,
	assertInviteeCanJoinHospital,
	assertOfficialEmail,
} from "./auth-policies";

// const sql = postgres(ENV.DATABASE_URL!);
const globalForDb = globalThis as unknown as {
	sql: ReturnType<typeof postgres> | undefined;
};

export const sql =
	globalForDb.sql ??
	postgres(ENV.DATABASE_URL!, {
		max: Number(process.env.POSTGRES_POOL_MAX ?? 5),
		idle_timeout: 20,
		connect_timeout: 10,
	});

if (process.env.NODE_ENV !== "production") {
	globalForDb.sql = sql;
}

export const db = drizzle({ client: sql });

async function hasHospitalMembership(userId: string) {
	const [membership] = await db
		.select({ id: schema.member.id })
		.from(schema.member)
		.where(eq(schema.member.userId, userId))
		.limit(1);

	return Boolean(membership);
}

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url }) => {
			if (process.env.NODE_ENV === "development") {
				console.info("Password reset link (development only):", url);
				return;
			}

			after(async () => {
				try {
					await sendPasswordResetEmail(user.email, url);
				} catch (error) {
					console.error(
						"Failed to send password reset email.",
						error instanceof Error ? error.message : String(error),
					);
				}
			});
		},
	},
	emailVerification: {
		autoSignInAfterVerification: true,
		sendOnSignIn: true,
		sendVerificationEmail: async ({ user, url }) => {
			after(async () => {
				try {
					await sendEmail(user.email, url);
				} catch (error) {
					console.error(
						"Failed to send verification email.",
						error instanceof Error ? error.message : String(error),
					);
				}
			});
		},
	},
	user: {
		deleteUser: {
			enabled: true,
			beforeDelete: async (user) => {
				const memberships = await db
					.select({ role: schema.member.role })
					.from(schema.member)
					.where(eq(schema.member.userId, user.id));

				assertAccountCanBeDeleted(memberships.map((membership) => membership.role));
			},
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					assertOfficialEmail(user.email);
				},
			},
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		cookieCache: {
			enabled: true,
			maxAge: 60,
		},
	},
	// Enabled in every environment; Better Auth's stricter built-in rules still apply to
	// sign-in, sign-up, password changes, and verification or reset emails.
	rateLimit: {
		enabled: true,
		window: 60,
		max: 100,
	},
	debug: true,
	secret: ENV.BETTER_AUTH_SECRET!,
	baseURL: ENV.BETTER_AUTH_URL,
	plugins: [
		admin(),
		organization({
			creatorRole: "owner",
			allowUserToCreateOrganization: false,
			organizationHooks: {
				beforeCreateInvitation: async ({ invitation, inviter }) => {
					const [inviterAccess] = await db
						.select({
							inviterRole: schema.member.role,
							isOrganizationVerified: schema.organization.isVerified,
						})
						.from(schema.member)
						.innerJoin(
							schema.organization,
							eq(schema.member.organizationId, schema.organization.id),
						)
						.where(
							and(
								eq(schema.member.organizationId, invitation.organizationId),
								eq(schema.member.userId, inviter.id),
							),
						)
						.limit(1);

					assertInvitationAllowed(invitation, inviterAccess);

					const [inviteeMembership] = await db
						.select({ id: schema.member.id })
						.from(schema.member)
						.innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
						.where(eq(schema.user.email, invitation.email.toLowerCase()))
						.limit(1);

					assertInviteeCanJoinHospital(Boolean(inviteeMembership));
				},
				// Runs when a hospital is created and when a member is added directly.
				beforeAddMember: async ({ user }) => {
					assertCanJoinHospital(await hasHospitalMembership(user.id));
				},
				beforeAcceptInvitation: async ({ user }) => {
					assertCanJoinHospital(await hasHospitalMembership(user.id));
				},
			},
		}),
		nextCookies(),
	],
});
