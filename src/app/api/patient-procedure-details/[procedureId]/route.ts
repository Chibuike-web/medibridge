import { getPatientProcedureDetails } from "@/lib/api/get-patient-procedure-details";
import { NextResponse } from "next/server";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/patient-procedure-details/[procedureId]">,
) {
	const { procedureId } = await context.params;
	const procedure = await getPatientProcedureDetails(procedureId);

	if (!procedure) {
		return NextResponse.json({ procedure: null }, { status: 404 });
	}

	return NextResponse.json({ procedure });
}
