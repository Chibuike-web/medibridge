import { desc, eq } from "drizzle-orm";
import { patientRecordAccess, patientRecordAccessVerification } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";

export type AccessVerificationState =
	| {
			status: "ready";
			recipientEmail: string;
			targetHospitalAdminName: string | null;
			codeExpiresAt: string;
	  }
	| {
			status: "code-expired";
			recipientEmail: string;
			targetHospitalAdminName: string | null;
			codeExpiresAt: string;
	  }
	| {
			status: "no-code";
			recipientEmail: string;
			targetHospitalAdminName: string | null;
	  }
	| {
			status: "access-expired" | "revoked" | "invalid";
			recipientEmail: string | null;
			targetHospitalAdminName: string | null;
	  };

export async function getAccessVerificationState(
	accessId: string,
): Promise<AccessVerificationState> {
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
		return {
			status: "invalid",
			recipientEmail: null,
			targetHospitalAdminName: null,
		};
	}

	if (access.status === "revoked") {
		return {
			status: "revoked",
			recipientEmail: access.recipientEmail,
			targetHospitalAdminName: null,
		};
	}

	if (access.expiresAt.getTime() <= Date.now() || access.status === "expired") {
		return {
			status: "access-expired",
			recipientEmail: access.recipientEmail,
			targetHospitalAdminName: null,
		};
	}

	const [verification] = await db
		.select({
			codeExpiresAt: patientRecordAccessVerification.codeExpiresAt,
			targetHospitalAdminEmail: patientRecordAccessVerification.targetHospitalAdminEmail,
			targetHospitalAdminName: patientRecordAccessVerification.targetHospitalAdminName,
		})
		.from(patientRecordAccessVerification)
		.where(eq(patientRecordAccessVerification.accessId, access.id))
		.orderBy(desc(patientRecordAccessVerification.createdAt))
		.limit(1);

	if (!verification) {
		return {
			status: "no-code",
			recipientEmail: access.recipientEmail,
			targetHospitalAdminName: null,
		};
	}

	const codeExpiresAt = verification.codeExpiresAt.toISOString();
	const recipientEmail = verification.targetHospitalAdminEmail || access.recipientEmail;

	if (verification.codeExpiresAt.getTime() <= Date.now()) {
		return {
			status: "code-expired",
			recipientEmail,
			targetHospitalAdminName: verification.targetHospitalAdminName,
			codeExpiresAt,
		};
	}

	return {
		status: "ready",
		recipientEmail,
		targetHospitalAdminName: verification.targetHospitalAdminName,
		codeExpiresAt,
	};
}
