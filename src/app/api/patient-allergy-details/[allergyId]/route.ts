import { getPatientAllergyDetails } from "@/lib/api/get-patient-allergy-details";
import { NextResponse } from "next/server";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/patient-allergy-details/[allergyId]">,
) {
	const { allergyId } = await context.params;
	const allergy = await getPatientAllergyDetails(allergyId);

	if (!allergy) {
		return NextResponse.json({ allergy: null }, { status: 404 });
	}

	return NextResponse.json({ allergy });
}
