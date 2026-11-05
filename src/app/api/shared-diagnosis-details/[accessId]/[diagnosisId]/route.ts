import { hasVerifiedExternalAccessSession } from "@/lib/api/external-access-session";
import { getSharedDiagnosisDetails } from "@/lib/api/get-shared-diagnosis-details";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/shared-diagnosis-details/[accessId]/[diagnosisId]">,
) {
	const { accessId, diagnosisId } = await context.params;

	const hasVerifiedAccessSession = await hasVerifiedExternalAccessSession(accessId);

	if (!hasVerifiedAccessSession) {
		return Response.json(
			{ status: "failed", error: "Verify your access to view this shared record." },
			{ status: 401 },
		);
	}

	const diagnosis = await getSharedDiagnosisDetails(accessId, diagnosisId);

	if (!diagnosis) {
		return Response.json({ diagnosis: null }, { status: 404 });
	}

	return Response.json({ diagnosis });
}
