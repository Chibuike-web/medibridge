import { getPatientProcedureDetails } from "@/lib/api/get-patient-procedure-details";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/patient-procedure-details/[procedureId]">,
) {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return Response.json(
			{ status: "failed", error: "Sign in to view patient records." },
			{ status: 401 },
		);
	}

	if (!session.user.emailVerified) {
		return Response.json(
			{ status: "failed", error: "Verify your email before you can view patient records." },
			{ status: 403 },
		);
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return Response.json(
			{
				status: "failed",
				error: "Your hospital must be verified before you can view patient records.",
			},
			{ status: 403 },
		);
	}

	const { procedureId } = await context.params;
	const procedure = await getPatientProcedureDetails(procedureId);

	if (!procedure) {
		return Response.json({ procedure: null }, { status: 404 });
	}

	return Response.json({ procedure });
}
