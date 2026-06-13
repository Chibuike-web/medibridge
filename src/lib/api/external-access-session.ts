import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { patientRecordAccess } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { ENV } from "@/lib/utils/env";

const externalAccessSessionCookieName = "medibridge_external_access_session";

function getExternalAccessSessionSecret() {
	return new TextEncoder().encode(ENV.BETTER_AUTH_SECRET);
}

export async function createExternalAccessSession({
	accessId,
	expiresAt,
}: {
	accessId: string;
	expiresAt: Date;
}) {
	const sessionToken = await new SignJWT({ accessId })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
		.sign(getExternalAccessSessionSecret());

	const cookieStore = await cookies();
	cookieStore.set({
		name: externalAccessSessionCookieName,
		value: sessionToken,
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		expires: expiresAt,
	});
}

export async function hasVerifiedExternalAccessSession(accessId: string) {
	const cookieStore = await cookies();
	const sessionToken = cookieStore.get(externalAccessSessionCookieName)?.value;

	if (!sessionToken) return false;

	try {
		const { payload } = await jwtVerify(sessionToken, getExternalAccessSessionSecret());

		if (payload.accessId !== accessId) return false;

		const [access] = await db
			.select({
				id: patientRecordAccess.id,
				status: patientRecordAccess.status,
				expiresAt: patientRecordAccess.expiresAt,
				revokedAt: patientRecordAccess.revokedAt,
				verifiedAt: patientRecordAccess.verifiedAt,
			})
			.from(patientRecordAccess)
			.where(
				and(
					eq(patientRecordAccess.id, accessId),
					eq(patientRecordAccess.status, "active"),
				),
			);

		if (!access) return false;
		if (!access.verifiedAt) return false;
		if (access.revokedAt) return false;

		return access.expiresAt.getTime() > Date.now();
	} catch {
		return false;
	}
}
