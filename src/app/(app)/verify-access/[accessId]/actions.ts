"use server";

import bcrypt from "bcrypt";
import { randomInt, randomUUID } from "crypto";
import { and, desc, eq, gt, isNull, lt, ne, sql } from "drizzle-orm";
import {
	patientRecordAccess,
	patientRecordAccessVerification,
	patientTransfer,
} from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { createExternalAccessSession } from "@/lib/api/external-access-session";
import { sendAccessCodeEmail } from "@/lib/utils/send-access-code-email";

type RequestAccessCodeActionResult =
	| { status: "success"; message: string }
	| { status: "failed"; error: string };

type VerifyAccessCodeActionResult = { status: "success" } | { status: "failed"; error: string };

export async function requestAccessCodeAction(
	accessId: string,
): Promise<RequestAccessCodeActionResult> {
	const [access] = await db
		.select({
			id: patientRecordAccess.id,
			targetHospitalEmail: patientTransfer.targetHospitalEmail,
			targetHospitalName: patientTransfer.targetHospitalName,
			status: patientRecordAccess.status,
			revokedAt: patientRecordAccess.revokedAt,
			expiresAt: patientRecordAccess.expiresAt,
		})
		.from(patientRecordAccess)
		.innerJoin(patientTransfer, eq(patientRecordAccess.patientTransferId, patientTransfer.id))
		.where(eq(patientRecordAccess.id, accessId));

	if (!access) {
		return { status: "failed", error: "This shared patient record link is invalid." };
	}

	if (access.status === "revoked" || access.revokedAt) {
		return { status: "failed", error: "This shared patient record has been revoked." };
	}

	if (access.status === "expired" || access.expiresAt.getTime() <= Date.now()) {
		return { status: "failed", error: "This shared patient record has expired." };
	}

	const [latestVerification] = await db
		.select({
			codeExpiresAt: patientRecordAccessVerification.codeExpiresAt,
			targetHospitalEmail: patientRecordAccessVerification.targetHospitalEmail,
		})
		.from(patientRecordAccessVerification)
		.where(eq(patientRecordAccessVerification.accessId, access.id))
		.orderBy(desc(patientRecordAccessVerification.createdAt))
		.limit(1);

	if (latestVerification && latestVerification.codeExpiresAt.getTime() > Date.now()) {
		return { status: "success", message: "A verification code is already active." };
	}

	const code = randomInt(100000, 1000000).toString();
	const codeHash = await bcrypt.hash(code, 10);
	const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
	const targetHospitalEmail = latestVerification?.targetHospitalEmail || access.targetHospitalEmail;
	const verificationId = randomUUID();

	await db.insert(patientRecordAccessVerification).values({
		id: verificationId,
		accessId: access.id,
		codeHash,
		codeExpiresAt,
		targetHospitalEmail,
		targetHospitalName: access.targetHospitalName,
	});

	try {
		const emailResult = await sendAccessCodeEmail({
			email: targetHospitalEmail,
			code,
		});

		if (!emailResult.error) {
			return { status: "success", message: "A new verification code has been sent." };
		}
	} catch (error) {
		console.error(error);
	}

	await db
		.delete(patientRecordAccessVerification)
		.where(eq(patientRecordAccessVerification.id, verificationId));

	return {
		status: "failed",
		error: "We could not send a new verification code. Please try again.",
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
		return { status: "failed", error: "Enter the 6-digit verification code." };
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
		return { status: "failed", error: "This shared patient record link is invalid." };
	}

	if (access.status === "revoked" || access.revokedAt) {
		return { status: "failed", error: "This shared patient record has been revoked." };
	}

	if (access.status === "expired" || access.expiresAt.getTime() <= Date.now()) {
		return { status: "failed", error: "This shared patient record has expired." };
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
		return { status: "failed", error: "No active verification code was found." };
	}

	if (latestVerification.consumedAt) {
		return { status: "failed", error: "This verification code has already been used." };
	}

	if (latestVerification.codeExpiresAt.getTime() <= Date.now()) {
		return { status: "failed", error: "This verification code has expired." };
	}

	// Reserve an attempt in the database so parallel guesses share the same limit.
	const [attempt] = await db
		.update(patientRecordAccessVerification)
		.set({ attempts: sql`${patientRecordAccessVerification.attempts} + 1` })
		.where(
			and(
				eq(patientRecordAccessVerification.id, latestVerification.id),
				lt(patientRecordAccessVerification.attempts, 5),
				isNull(patientRecordAccessVerification.consumedAt),
				gt(patientRecordAccessVerification.codeExpiresAt, new Date()),
			),
		)
		.returning({ id: patientRecordAccessVerification.id });

	if (!attempt) {
		return {
			status: "failed",
			error: "This verification code is unavailable. Request a new code after it expires.",
		};
	}

	const isVerificationCodeCorrect = await bcrypt.compare(
		normalizedVerificationCode,
		latestVerification.codeHash,
	);

	if (!isVerificationCodeCorrect) {
		return { status: "failed", error: "The verification code is incorrect." };
	}

	const verifiedAt = new Date();

	const activatedAccess = await db.transaction(async (tx) => {
		const [consumedVerification] = await tx
			.update(patientRecordAccessVerification)
			.set({ consumedAt: verifiedAt })
			.where(
				and(
					eq(patientRecordAccessVerification.id, latestVerification.id),
					isNull(patientRecordAccessVerification.consumedAt),
					gt(patientRecordAccessVerification.codeExpiresAt, verifiedAt),
				),
			)
			.returning({ id: patientRecordAccessVerification.id });

		if (!consumedVerification) return null;

		const [activatedAccess] = await tx
			.update(patientRecordAccess)
			.set({
				status: "active",
				verifiedAt,
				updatedAt: verifiedAt,
			})
			.where(
				and(
					eq(patientRecordAccess.id, access.id),
					isNull(patientRecordAccess.revokedAt),
					ne(patientRecordAccess.status, "revoked"),
					ne(patientRecordAccess.status, "expired"),
					gt(patientRecordAccess.expiresAt, verifiedAt),
				),
			)
			.returning({ id: patientRecordAccess.id, expiresAt: patientRecordAccess.expiresAt });

		return activatedAccess ?? null;
	});

	if (!activatedAccess) {
		return {
			status: "failed",
			error: "This verification code or shared record is no longer available.",
		};
	}

	await createExternalAccessSession({
		accessId: access.id,
		expiresAt: activatedAccess.expiresAt,
	});

	return { status: "success" };
}
