import { getPatientAllergyDetails } from "@/lib/api/get-patient-allergy-details";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/patient-allergy-details/[allergyId]">,
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

	const { allergyId } = await context.params;
	const allergy = await getPatientAllergyDetails(allergyId);

	if (!allergy) {
		return Response.json({ allergy: null }, { status: 404 });
	}

	return Response.json({ allergy });
}
