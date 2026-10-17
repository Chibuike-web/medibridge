import { getPatientAllergies } from "@/lib/api/get-patient-allergies";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getNumberParam, getStringParam } from "@/lib/utils/search-params";
import type {
	AllergyType,
	AllergyStatusFilter,
	AllergySeverityFilter,
} from "@/features/patients/types";

export type PatientAllergiesTableResult =
	| { status: "success"; allergies: AllergyType[]; page: number; limit: number; totalPages: number }
	| { status: "failed"; error: string };

export async function GET(
	request: Request,
	context: RouteContext<"/api/patient-allergies/[patientId]">,
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
	const statusFilters = (searchParams.get("statusFilters") ?? "")
		.split(",")
		.filter((value): value is AllergyStatusFilter => ["active", "inactive"].includes(value));
	const severityFilters = (searchParams.get("severityFilters") ?? "")
		.split(",")
		.filter((value): value is AllergySeverityFilter =>
			["mild", "moderate", "severe"].includes(value),
		);

	try {
		const { allergies, totalAllergies } = await getPatientAllergies(
			patientId,
			currentPage,
			currentLimit,
			query,
			{ createdFrom, createdTo },
			statusFilters,
			severityFilters,
			encounterId,
		);

		const result: PatientAllergiesTableResult = {
			status: "success",
			allergies,
			page: currentPage,
			limit: currentLimit,
			totalPages: Math.ceil(totalAllergies / currentLimit) || 1,
		};

		return Response.json(result);
	} catch (error) {
		console.error("Loading patient allergies failed:", error);
		const result: PatientAllergiesTableResult = {
			status: "failed",
			error: "Unable to load patient allergies.",
		};
		return Response.json(result, { status: 500 });
	}
}
