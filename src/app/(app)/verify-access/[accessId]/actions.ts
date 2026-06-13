"use server";

import bcrypt from "bcrypt";
import { randomInt, randomUUID } from "crypto";
import { desc, eq, sql } from "drizzle-orm";
import { patientRecordAccess, patientRecordAccessVerification } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { createExternalAccessSession } from "@/lib/api/external-access-session";
import { sendAccessCodeEmail } from "@/lib/utils/send-access-code-email";

type VerifyAccessCodeActionResult =
	| { success: true }
	| { success: false; message: string };

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

export async function verifyAccessCodeAction({
	accessId,
	verificationCode,
}: {
	accessId: string;
	verificationCode: string;
}): Promise<VerifyAccessCodeActionResult> {
	const normalizedVerificationCode = verificationCode.trim();

	if (!/^\d{6}$/.test(normalizedVerificationCode)) {
		return { success: false, message: "Enter the 6-digit verification code." };
	}

	const [access] = await db
		.select({
			id: patientRecordAccess.id,
			status: patientRecordAccess.status,
			expiresAt: patientRecordAccess.expiresAt,
			revokedAt: patientRecordAccess.revokedAt,
		})
		.from(patientRecordAccess)
		.where(eq(patientRecordAccess.id, accessId));

	if (!access) {
		return { success: false, message: "This shared patient record link is invalid." };
	}

	if (access.status === "revoked" || access.revokedAt) {
		return { success: false, message: "This shared patient record has been revoked." };
	}

	if (access.status === "expired" || access.expiresAt.getTime() <= Date.now()) {
		return { success: false, message: "This shared patient record has expired." };
	}

	const [latestVerification] = await db
		.select({
			id: patientRecordAccessVerification.id,
			codeHash: patientRecordAccessVerification.codeHash,
			codeExpiresAt: patientRecordAccessVerification.codeExpiresAt,
			consumedAt: patientRecordAccessVerification.consumedAt,
		})
		.from(patientRecordAccessVerification)
		.where(eq(patientRecordAccessVerification.accessId, access.id))
		.orderBy(desc(patientRecordAccessVerification.createdAt))
		.limit(1);

	if (!latestVerification) {
		return { success: false, message: "No active verification code was found." };
	}

	if (latestVerification.consumedAt) {
		return { success: false, message: "This verification code has already been used." };
	}

	if (latestVerification.codeExpiresAt.getTime() <= Date.now()) {
		return { success: false, message: "This verification code has expired." };
	}

	const isVerificationCodeCorrect = await bcrypt.compare(
		normalizedVerificationCode,
		latestVerification.codeHash,
	);

	if (!isVerificationCodeCorrect) {
		await db
			.update(patientRecordAccessVerification)
			.set({ attempts: sql`${patientRecordAccessVerification.attempts} + 1` })
			.where(eq(patientRecordAccessVerification.id, latestVerification.id));

		return { success: false, message: "The verification code is incorrect." };
	}

	const verifiedAt = new Date();

	await Promise.all([
		db
			.update(patientRecordAccessVerification)
			.set({ consumedAt: verifiedAt })
			.where(eq(patientRecordAccessVerification.id, latestVerification.id)),
		db
			.update(patientRecordAccess)
			.set({
				status: "active",
				verifiedAt,
				updatedAt: verifiedAt,
			})
			.where(eq(patientRecordAccess.id, access.id)),
	]);

	await createExternalAccessSession({
		accessId: access.id,
		expiresAt: access.expiresAt,
	});

	return { success: true };
}
