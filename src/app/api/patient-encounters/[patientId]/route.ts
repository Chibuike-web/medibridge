import { getPatientEncounters } from "@/lib/api/get-patient-encounters";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getNumberParam, getStringParam } from "@/lib/utils/search-params";
import type {
	EncounterType,
	EncounterTypeFilter,
	EncounterDepartmentFilter,
} from "@/features/patients/types";

export type PatientEncountersTableResult =
	| {
			status: "success";
			encounters: EncounterType[];
			page: number;
			limit: number;
			totalPages: number;
	  }
	| { status: "failed"; error: string };

export async function GET(
	request: Request,
	context: RouteContext<"/api/patient-encounters/[patientId]">,
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
	const encounterFrom = getStringParam(searchParams.get("encounterFrom"));
	const encounterTo = getStringParam(searchParams.get("encounterTo"));
	const createdFrom = getStringParam(searchParams.get("createdFrom"));
	const createdTo = getStringParam(searchParams.get("createdTo"));
	const encounterTypeFilters = (searchParams.get("encounterTypeFilters") ?? "")
		.split(",")
		.filter((value): value is EncounterTypeFilter =>
			(
				["emergency-visit", "routine-checkup", "follow-up-visit", "outpatient-visit"] as string[]
			).includes(value),
		);
	const departmentFilters = (searchParams.get("departmentFilters") ?? "")
		.split(",")
		.filter((value): value is EncounterDepartmentFilter =>
			(
				[
					"emergency-medicine",
					"general-medicine",
					"cardiology",
					"endocrinology",
					"family-medicine",
					"nephrology",
				] as string[]
			).includes(value),
		);

	try {
		const { encounters, totalEncounters } = await getPatientEncounters(
			patientId,
			currentPage,
			currentLimit,
			query,
			{ encounterFrom, encounterTo, createdFrom, createdTo },
			encounterTypeFilters,
			departmentFilters,
		);

		const result: PatientEncountersTableResult = {
			status: "success",
			encounters,
			page: currentPage,
			limit: currentLimit,
			totalPages: Math.ceil(totalEncounters / currentLimit) || 1,
		};

		return Response.json(result);
	} catch (error) {
		console.error("Loading patient encounters failed:", error);
		const result: PatientEncountersTableResult = {
			status: "failed",
			error: "Unable to load patient encounters.",
		};
		return Response.json(result, { status: 500 });
	}
}
