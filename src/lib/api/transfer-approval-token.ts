import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { ENV } from "@/lib/utils/env";

function getTransferApprovalSecret() {
	return new TextEncoder().encode(ENV.BETTER_AUTH_SECRET);
}

export async function createTransferApprovalToken({
	transferId,
	patientId,
	expiresAt,
}: {
	transferId: string;
	patientId: string;
	expiresAt: Date;
}) {
	return new SignJWT({ transferId, patientId, purpose: "transfer-approval" })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
		.sign(getTransferApprovalSecret());
}

export async function verifyTransferApprovalToken(
	token: string,
	transferId: string,
) {
	if (!token) return null;

	try {
		const { payload } = await jwtVerify(token, getTransferApprovalSecret());

		if (
			payload.purpose !== "transfer-approval" ||
			payload.transferId !== transferId
		) {
			return null;
		}

		return typeof payload.patientId === "string"
			? { patientId: payload.patientId }
			: null;
	} catch {
		return null;
	}
}
