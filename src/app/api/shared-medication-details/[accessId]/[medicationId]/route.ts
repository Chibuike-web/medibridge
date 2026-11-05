import { hasVerifiedExternalAccessSession } from "@/lib/api/external-access-session";
import { getSharedMedicationDetails } from "@/lib/api/get-shared-medication-details";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/shared-medication-details/[accessId]/[medicationId]">,
) {
	const { accessId, medicationId } = await context.params;

	const hasVerifiedAccessSession = await hasVerifiedExternalAccessSession(accessId);

	if (!hasVerifiedAccessSession) {
		return Response.json(
			{ status: "failed", error: "Verify your access to view this shared record." },
			{ status: 401 },
		);
	}

	const medication = await getSharedMedicationDetails(accessId, medicationId);

	if (!medication) {
		return Response.json({ medication: null }, { status: 404 });
	}

	return Response.json({ medication });
}
