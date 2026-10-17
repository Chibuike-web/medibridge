import { getPatientDiagnoses } from "@/lib/api/get-patient-diagnoses";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getNumberParam, getStringParam } from "@/lib/utils/search-params";
import type { DiagnosisType, DiagnosisStatusFilter } from "@/features/patients/types";

export type PatientDiagnosesTableResult =
	| {
			status: "success";
			diagnoses: DiagnosisType[];
			page: number;
			limit: number;
			totalPages: number;
	  }
	| { status: "failed"; error: string };

export async function GET(
	request: Request,
	context: RouteContext<"/api/patient-diagnoses/[patientId]">,
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

	const { patientId } = await context.params;
	const searchParams = new URL(request.url).searchParams;
	const currentPage = getNumberParam(searchParams.get("page"), 1, { min: 1 });
	const currentLimit = getNumberParam(searchParams.get("limit"), 14, { min: 1, max: 100 });
	const query = getStringParam(searchParams.get("query"));
	const encounterId = searchParams.get("encounterId") || undefined;
	const createdFrom = getStringParam(searchParams.get("createdFrom"));
	const createdTo = getStringParam(searchParams.get("createdTo"));
	const diagnosedFrom = getStringParam(searchParams.get("diagnosedFrom"));
	const diagnosedTo = getStringParam(searchParams.get("diagnosedTo"));
	const lastReviewedFrom = getStringParam(searchParams.get("lastReviewedFrom"));
	const lastReviewedTo = getStringParam(searchParams.get("lastReviewedTo"));
	const statusFilters = (searchParams.get("statusFilters") ?? "")
		.split(",")
		.filter((value): value is DiagnosisStatusFilter => ["active", "resolved"].includes(value));

	try {
		const { diagnoses, totalDiagnoses } = await getPatientDiagnoses(
			patientId,
			currentPage,
			currentLimit,
			query,
			{
				createdFrom,
				createdTo,
				diagnosedFrom,
				diagnosedTo,
				lastReviewedFrom,
				lastReviewedTo,
			},
			statusFilters,
			encounterId,
		);

		const result: PatientDiagnosesTableResult = {
			status: "success",
			diagnoses,
			page: currentPage,
			limit: currentLimit,
			totalPages: Math.ceil(totalDiagnoses / currentLimit) || 1,
		};

		return Response.json(result);
	} catch (error) {
		console.error("Loading patient diagnoses failed:", error);
		const result: PatientDiagnosesTableResult = {
			status: "failed",
			error: "Unable to load patient diagnoses.",
		};
		return Response.json(result, { status: 500 });
	}
}
