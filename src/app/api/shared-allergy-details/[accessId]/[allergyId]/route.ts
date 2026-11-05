import { hasVerifiedExternalAccessSession } from "@/lib/api/external-access-session";
import { getSharedAllergyDetails } from "@/lib/api/get-shared-allergy-details";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/shared-allergy-details/[accessId]/[allergyId]">,
) {
	const { accessId, allergyId } = await context.params;

	const hasVerifiedAccessSession = await hasVerifiedExternalAccessSession(accessId);

	if (!hasVerifiedAccessSession) {
		return Response.json(
			{ status: "failed", error: "Verify your access to view this shared record." },
			{ status: 401 },
		);
	}

	const allergy = await getSharedAllergyDetails(accessId, allergyId);

	if (!allergy) {
		return Response.json({ allergy: null }, { status: 404 });
	}

	return Response.json({ allergy });
}
