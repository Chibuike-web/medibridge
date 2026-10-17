import { getPatientImaging } from "@/lib/api/get-patient-imaging";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getNumberParam, getStringParam } from "@/lib/utils/search-params";
import type {
	ImagingType,
	ImagingStatusFilter,
	ImagingModalityFilter,
} from "@/features/patients/types";

export type PatientImagingTableResult =
	| {
			status: "success";
			imagingStudies: ImagingType[];
			page: number;
			limit: number;
			totalPages: number;
	  }
	| { status: "failed"; error: string };

export async function GET(
	request: Request,
	context: RouteContext<"/api/patient-imaging/[patientId]">,
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
	const orderedFrom = getStringParam(searchParams.get("orderedFrom"));
	const orderedTo = getStringParam(searchParams.get("orderedTo"));
	const createdFrom = getStringParam(searchParams.get("createdFrom"));
	const createdTo = getStringParam(searchParams.get("createdTo"));
	const statusFilters = (searchParams.get("statusFilters") ?? "")
		.split(",")
		.filter((value): value is ImagingStatusFilter =>
			["pending", "completed", "cancelled"].includes(value),
		);
	const modalityFilters = (searchParams.get("modalityFilters") ?? "")
		.split(",")
		.filter((value): value is ImagingModalityFilter =>
			["ct", "mri", "ultrasound", "x-ray"].includes(value),
		);

	try {
		const { imagingStudies, totalImagingStudies } = await getPatientImaging(
			patientId,
			currentPage,
			currentLimit,
			query,
			{ orderedFrom, orderedTo, createdFrom, createdTo },
			statusFilters,
			modalityFilters,
			encounterId,
		);

		const result: PatientImagingTableResult = {
			status: "success",
			imagingStudies,
			page: currentPage,
			limit: currentLimit,
			totalPages: Math.ceil(totalImagingStudies / currentLimit) || 1,
		};

		return Response.json(result);
	} catch (error) {
		console.error("Loading patient imaging failed:", error);
		const result: PatientImagingTableResult = {
			status: "failed",
			error: "Unable to load patient imaging.",
		};
		return Response.json(result, { status: 500 });
	}
}
