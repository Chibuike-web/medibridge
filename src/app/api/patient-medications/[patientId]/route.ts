import { getPatientMedications } from "@/lib/api/get-patient-medications";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getNumberParam, getStringParam } from "@/lib/utils/search-params";
import type { MedicationType, MedicationStatusFilter } from "@/features/patients/types";

export type PatientMedicationsTableResult =
	| {
			status: "success";
			medications: MedicationType[];
			page: number;
			limit: number;
			totalPages: number;
	  }
	| { status: "failed"; error: string };

export async function GET(
	request: Request,
	context: RouteContext<"/api/patient-medications/[patientId]">,
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
		.filter((value): value is MedicationStatusFilter =>
			["active", "completed", "discontinued"].includes(value),
		);

	try {
		const { medications, totalMedications } = await getPatientMedications(
			patientId,
			currentPage,
			currentLimit,
			query,
			{ createdFrom, createdTo },
			statusFilters,
			encounterId,
		);

		const result: PatientMedicationsTableResult = {
			status: "success",
			medications,
			page: currentPage,
			limit: currentLimit,
			totalPages: Math.ceil(totalMedications / currentLimit) || 1,
		};

		return Response.json(result);
	} catch (error) {
		console.error("Loading patient medications failed:", error);
		const result: PatientMedicationsTableResult = {
			status: "failed",
			error: "Unable to load patient medications.",
		};
		return Response.json(result, { status: 500 });
	}
}
