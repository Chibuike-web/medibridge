import { hasVerifiedExternalAccessSession } from "@/lib/api/external-access-session";
import { getSharedImagingDetails } from "@/lib/api/get-shared-imaging-details";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/shared-imaging-details/[accessId]/[imagingId]">,
) {
	const { accessId, imagingId } = await context.params;

	const hasVerifiedAccessSession = await hasVerifiedExternalAccessSession(accessId);

	if (!hasVerifiedAccessSession) {
		return Response.json(
			{ status: "failed", error: "Verify your access to view this shared record." },
			{ status: 401 },
		);
	}

	const imaging = await getSharedImagingDetails(accessId, imagingId);

	if (!imaging) {
		return Response.json({ imaging: null }, { status: 404 });
	}

	return Response.json({ imaging });
}
