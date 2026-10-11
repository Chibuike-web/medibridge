import { getPatientImmunizationDetails } from "@/lib/api/get-patient-immunization-details";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/patient-immunization-details/[immunizationId]">,
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

	const { immunizationId } = await context.params;
	const immunization = await getPatientImmunizationDetails(immunizationId);

	if (!immunization) {
		return Response.json({ immunization: null }, { status: 404 });
	}

	return Response.json({ immunization });
}
