import { hasVerifiedExternalAccessSession } from "@/lib/api/external-access-session";
import { getSharedImmunizationDetails } from "@/lib/api/get-shared-immunization-details";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/shared-immunization-details/[accessId]/[immunizationId]">,
) {
	const { accessId, immunizationId } = await context.params;

	const hasVerifiedAccessSession = await hasVerifiedExternalAccessSession(accessId);

	if (!hasVerifiedAccessSession) {
		return Response.json(
			{ status: "failed", error: "Verify your access to view this shared record." },
			{ status: 401 },
		);
	}

	const immunization = await getSharedImmunizationDetails(accessId, immunizationId);

	if (!immunization) {
		return Response.json({ immunization: null }, { status: 404 });
	}

	return Response.json({ immunization });
}
