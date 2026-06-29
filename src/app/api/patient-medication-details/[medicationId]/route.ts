import { getPatientMedicationDetails } from "@/lib/api/get-patient-medication-details";
import { NextResponse } from "next/server";

export async function GET(
	_request: Request,
	context: { params: Promise<{ medicationId: string }> },
) {
	const { medicationId } = await context.params;
	const medication = await getPatientMedicationDetails(medicationId);

	if (!medication) {
		return NextResponse.json({ medication: null }, { status: 404 });
	}

	return NextResponse.json({ medication });
}
