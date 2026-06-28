import { getPatientImmunizationDetails } from "@/lib/api/get-patient-immunization-details";
import { NextResponse } from "next/server";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/patient-immunization-details/[immunizationId]">,
) {
	const { immunizationId } = await context.params;
	const immunization = await getPatientImmunizationDetails(immunizationId);

	if (!immunization) {
		return NextResponse.json({ immunization: null }, { status: 404 });
	}

	return NextResponse.json({ immunization });
}
