import { hasVerifiedExternalAccessSession } from "@/lib/api/external-access-session";
import { getSharedProcedureDetails } from "@/lib/api/get-shared-procedure-details";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/shared-procedure-details/[accessId]/[procedureId]">,
) {
	const { accessId, procedureId } = await context.params;

	const hasVerifiedAccessSession = await hasVerifiedExternalAccessSession(accessId);

	if (!hasVerifiedAccessSession) {
		return Response.json(
			{ status: "failed", error: "Verify your access to view this shared record." },
			{ status: 401 },
		);
	}

	const procedure = await getSharedProcedureDetails(accessId, procedureId);

	if (!procedure) {
		return Response.json({ procedure: null }, { status: 404 });
	}

	return Response.json({ procedure });
}
