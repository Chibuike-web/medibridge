import { getPatientLabTests } from "@/lib/api/get-patient-lab-tests";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getNumberParam, getStringParam } from "@/lib/utils/search-params";
import type {
	LabTestType,
	LabTestStatusFilter,
	LabTestFlagFilter,
} from "@/features/patients/types";

export type PatientLabTestsTableResult =
	| { status: "success"; labTests: LabTestType[]; page: number; limit: number; totalPages: number }
	| { status: "failed"; error: string };

export async function GET(
	request: Request,
	context: RouteContext<"/api/patient-lab-tests/[patientId]">,
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
		.filter((value): value is LabTestStatusFilter =>
			["pending", "completed", "cancelled"].includes(value),
		);
	const flagFilters = (searchParams.get("flagFilters") ?? "")
		.split(",")
		.filter((value): value is LabTestFlagFilter =>
			(
				[
					"within-range",
					"abnormal",
					"high",
					"low",
					"critical",
					"pending",
					"borderline",
					"invalid",
					"cancelled",
					"inconclusive",
				] as string[]
			).includes(value),
		);

	try {
		const { labTests, totalLabTests } = await getPatientLabTests(
			patientId,
			currentPage,
			currentLimit,
			query,
			{ createdFrom, createdTo },
			statusFilters,
			flagFilters,
			encounterId,
		);

		const result: PatientLabTestsTableResult = {
			status: "success",
			labTests,
			page: currentPage,
			limit: currentLimit,
			totalPages: Math.ceil(totalLabTests / currentLimit) || 1,
		};

		return Response.json(result);
	} catch (error) {
		console.error("Loading patient lab-tests failed:", error);
		const result: PatientLabTestsTableResult = {
			status: "failed",
			error: "Unable to load patient lab-tests.",
		};
		return Response.json(result, { status: 500 });
	}
}
