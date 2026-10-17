import { getPatientVitals } from "@/lib/api/get-patient-vitals";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getNumberParam, getStringParam } from "@/lib/utils/search-params";
import type { VitalType } from "@/features/patients/types";

export type PatientVitalsTableResult =
	| { status: "success"; vitals: VitalType[]; page: number; limit: number; totalPages: number }
	| { status: "failed"; error: string };

export async function GET(
	request: Request,
	context: RouteContext<"/api/patient-vitals/[patientId]">,
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
	const recordedFrom = getStringParam(searchParams.get("recordedFrom"));
	const recordedTo = getStringParam(searchParams.get("recordedTo"));
	const createdFrom = getStringParam(searchParams.get("createdFrom"));
	const createdTo = getStringParam(searchParams.get("createdTo"));

	try {
		const { vitals, totalVitals } = await getPatientVitals(
			patientId,
			currentPage,
			currentLimit,
			query,
			{ recordedFrom, recordedTo, createdFrom, createdTo },
			encounterId,
		);

		const result: PatientVitalsTableResult = {
			status: "success",
			vitals,
			page: currentPage,
			limit: currentLimit,
			totalPages: Math.ceil(totalVitals / currentLimit) || 1,
		};

		return Response.json(result);
	} catch (error) {
		console.error("Loading patient vitals failed:", error);
		const result: PatientVitalsTableResult = {
			status: "failed",
			error: "Unable to load patient vitals.",
		};
		return Response.json(result, { status: 500 });
	}
}
