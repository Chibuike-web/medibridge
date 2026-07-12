import { getPatientDocumentDetails } from "@/lib/api/get-patient-document-details";
import { NextResponse } from "next/server";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/patient-document-details/[documentId]">,
) {
	const { documentId } = await context.params;
	const document = await getPatientDocumentDetails(documentId);

	if (!document) return NextResponse.json({ document: null }, { status: 404 });
	return NextResponse.json({ document });
}
