import "server-only";

import { findPendingInvitation } from "./find-pending-invitation";

export async function getInvitationPreviewService(invitationId: string) {
	if (!invitationId) {
		return { status: "invalid" as const };
	}

	const pendingInvitation = await findPendingInvitation(invitationId);

	if (!pendingInvitation) {
		return { status: "invalid" as const };
	}

	return {
		status: "success" as const,
		email: pendingInvitation.email,
		hasAccount: Boolean(pendingInvitation.hasAccount),
		organizationName: pendingInvitation.organizationName,
	};
}
