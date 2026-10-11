import { getTransferDetails } from "@/lib/api/get-transfer-details";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/transfer-details/[transferId]">,
) {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return Response.json(
			{ status: "failed", error: "Sign in to view transfer details." },
			{ status: 401 },
		);
	}

	if (!session.user.emailVerified) {
		return Response.json(
			{ status: "failed", error: "Verify your email before you can view transfer details." },
			{ status: 403 },
		);
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return Response.json(
			{
				status: "failed",
				error: "Your hospital must be verified before you can view transfer details.",
			},
			{ status: 403 },
		);
	}

	const { transferId } = await context.params;
	const transfer = await getTransferDetails(transferId);

	if (!transfer) {
		return Response.json({ transfer: null }, { status: 404 });
	}

	return Response.json({ transfer });
}
