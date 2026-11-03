import { hasVerifiedExternalAccessSession } from "@/lib/api/external-access-session";
import { getSharedLabTestDetails } from "@/lib/api/get-shared-lab-test-details";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/shared-lab-test-details/[accessId]/[labTestId]">,
) {
	const { accessId, labTestId } = await context.params;

	const hasVerifiedAccessSession = await hasVerifiedExternalAccessSession(accessId);

	if (!hasVerifiedAccessSession) {
		return Response.json(
			{ status: "failed", error: "Verify your access to view this shared record." },
			{ status: 401 },
		);
	}

	const labTest = await getSharedLabTestDetails(accessId, labTestId);

	if (!labTest) {
		return Response.json({ labTest: null }, { status: 404 });
	}

	return Response.json({ labTest });
}
