import { desc, eq } from "drizzle-orm";
import {
	patientRecordAccess,
	patientRecordAccessVerification,
	patientTransfer,
} from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";

export type AccessVerificationState =
	| {
			status: "ready";
			targetHospitalEmail: string;
			targetHospitalName: string;
			codeExpiresAt: string;
	  }
	| {
			status: "code-expired";
			targetHospitalEmail: string;
			targetHospitalName: string;
			codeExpiresAt: string;
	  }
	| {
			status: "no-code";
			targetHospitalEmail: string;
			targetHospitalName: string;
	  }
	| {
			status: "access-expired" | "revoked" | "invalid";
			targetHospitalEmail: string | null;
			targetHospitalName: string | null;
	  };

export async function getAccessVerificationState(
	accessId: string,
): Promise<AccessVerificationState> {
	const [access] = await db
		.select({
			id: patientRecordAccess.id,
			targetHospitalEmail: patientTransfer.targetHospitalEmail,
			targetHospitalName: patientTransfer.targetHospitalName,
			status: patientRecordAccess.status,
			expiresAt: patientRecordAccess.expiresAt,
		})
		.from(patientRecordAccess)
		.innerJoin(patientTransfer, eq(patientRecordAccess.patientTransferId, patientTransfer.id))
		.where(eq(patientRecordAccess.id, accessId));

	if (!access) {
		return {
			status: "invalid",
			targetHospitalEmail: null,
			targetHospitalName: null,
		};
	}

	if (access.status === "revoked") {
		return {
			status: "revoked",
			targetHospitalEmail: access.targetHospitalEmail,
			targetHospitalName: access.targetHospitalName,
		};
	}

	if (access.expiresAt.getTime() <= Date.now() || access.status === "expired") {
		return {
			status: "access-expired",
			targetHospitalEmail: access.targetHospitalEmail,
			targetHospitalName: access.targetHospitalName,
		};
	}

	const [verification] = await db
		.select({
			codeExpiresAt: patientRecordAccessVerification.codeExpiresAt,
			targetHospitalEmail: patientRecordAccessVerification.targetHospitalEmail,
			targetHospitalName: patientRecordAccessVerification.targetHospitalName,
		})
		.from(patientRecordAccessVerification)
		.where(eq(patientRecordAccessVerification.accessId, access.id))
		.orderBy(desc(patientRecordAccessVerification.createdAt))
		.limit(1);

	if (!verification) {
		return {
			status: "no-code",
			targetHospitalEmail: access.targetHospitalEmail,
			targetHospitalName: access.targetHospitalName,
		};
	}

	const codeExpiresAt = verification.codeExpiresAt.toISOString();
	const targetHospitalEmail = verification.targetHospitalEmail || access.targetHospitalEmail;

	if (verification.codeExpiresAt.getTime() <= Date.now()) {
		return {
			status: "code-expired",
			targetHospitalEmail,
			targetHospitalName: verification.targetHospitalName,
			codeExpiresAt,
		};
	}

	return {
		status: "ready",
		targetHospitalEmail,
		targetHospitalName: verification.targetHospitalName,
		codeExpiresAt,
	};
}
