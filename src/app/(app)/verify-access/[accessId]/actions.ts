"use server";

import bcrypt from "bcrypt";
import { randomInt, randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import { patientRecordAccess, patientRecordAccessVerification } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { sendAccessCodeEmail } from "@/lib/utils/send-access-code-email";

export async function requestAccessCodeAction(accessId: string) {
	const [access] = await db
		.select({
			id: patientRecordAccess.id,
			recipientEmail: patientRecordAccess.recipientEmail,
			status: patientRecordAccess.status,
			expiresAt: patientRecordAccess.expiresAt,
		})
		.from(patientRecordAccess)
		.where(eq(patientRecordAccess.id, accessId));

	if (!access) {
		return { success: false, message: "This shared patient record link is invalid." };
	}

	if (access.status === "revoked") {
		return { success: false, message: "This shared patient record has been revoked." };
	}

	if (access.status === "expired" || access.expiresAt.getTime() <= Date.now()) {
		return { success: false, message: "This shared patient record has expired." };
	}

	const [latestVerification] = await db
		.select({
			codeExpiresAt: patientRecordAccessVerification.codeExpiresAt,
			targetHospitalAdminEmail: patientRecordAccessVerification.targetHospitalAdminEmail,
			targetHospitalAdminName: patientRecordAccessVerification.targetHospitalAdminName,
		})
		.from(patientRecordAccessVerification)
		.where(eq(patientRecordAccessVerification.accessId, access.id))
		.orderBy(desc(patientRecordAccessVerification.createdAt))
		.limit(1);

	if (latestVerification && latestVerification.codeExpiresAt.getTime() > Date.now()) {
		return { success: true, message: "A verification code is already active." };
	}

	const code = randomInt(100000, 1000000).toString();
	const codeHash = await bcrypt.hash(code, 10);
	const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
	const targetHospitalAdminEmail =
		latestVerification?.targetHospitalAdminEmail || access.recipientEmail;
	const verificationId = randomUUID();

	await db.insert(patientRecordAccessVerification).values({
		id: verificationId,
		accessId: access.id,
		codeHash,
		codeExpiresAt,
		targetHospitalAdminEmail,
		targetHospitalAdminName: latestVerification?.targetHospitalAdminName ?? null,
	});

	try {
		const emailResult = await sendAccessCodeEmail({
			email: targetHospitalAdminEmail,
			code,
		});

		if (!emailResult.error) {
			return { success: true, message: "A new verification code has been sent." };
		}
	} catch (error) {
		console.error(error);
	}

	await db
		.delete(patientRecordAccessVerification)
		.where(eq(patientRecordAccessVerification.id, verificationId));

	return {
		success: false,
		message: "We could not send a new verification code. Please try again.",
	};
}
