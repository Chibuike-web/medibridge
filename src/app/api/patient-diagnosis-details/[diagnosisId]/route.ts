import { getPatientDiagnosisDetails } from "@/lib/api/get-patient-diagnosis-details";
import { NextResponse } from "next/server";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/patient-diagnosis-details/[diagnosisId]">,
) {
	const { diagnosisId } = await context.params;
	const diagnosis = await getPatientDiagnosisDetails(diagnosisId);

	if (!diagnosis) {
		return NextResponse.json({ diagnosis: null }, { status: 404 });
	}

	return NextResponse.json({ diagnosis });
}
