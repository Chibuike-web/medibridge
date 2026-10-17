import { getPatients } from "@/lib/api/get-patients";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getNumberParam, parseDateBoundaryParam } from "@/lib/utils/search-params";
import type { PatientListItemType, PatientAgeGroupFilter } from "@/features/patients/types";

export type PatientsTableResult =
	| {
			status: "success";
			patients: PatientListItemType[];
			page: number;
			limit: number;
			totalPages: number;
	  }
	| { status: "failed"; error: string };

export async function GET(request: Request) {
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

	const searchParams = new URL(request.url).searchParams;
	const page = getNumberParam(searchParams.get("page"), 1, { min: 1 });
	const limit = getNumberParam(searchParams.get("limit"), 14, { min: 1, max: 100 });
	const query = searchParams.get("query") ?? "";
	const createdAtFilter = {
		from: parseDateBoundaryParam(searchParams.get("createdFrom") ?? "", "start"),
		to: parseDateBoundaryParam(searchParams.get("createdTo") ?? "", "end"),
	};
	const gender = searchParams.get("gender");
	const genderFilter = gender === "male" || gender === "female" ? gender : undefined;
	const ageGroup = searchParams.get("ageGroup") as PatientAgeGroupFilter;
	const ageRanges = {
		children: { min: 0, max: 12 },
		teenagers: { min: 13, max: 17 },
		"young-adults": { min: 18, max: 35 },
		adults: { min: 36, max: 59 },
		seniors: { min: 60 },
	};
	const ageRange = Object.hasOwn(ageRanges, ageGroup)
		? ageRanges[ageGroup as keyof typeof ageRanges]
		: undefined;
	try {
		const { patients, totalPatients } = await getPatients(page, limit, query, createdAtFilter, {
			gender: genderFilter,
			ageRange,
		});
		const result: PatientsTableResult = {
			status: "success",
			patients,
			page,
			limit,
			totalPages: Math.ceil(totalPatients / limit) || 1,
		};
		return Response.json(result);
	} catch (error) {
		console.error("Loading patients failed:", error);
		const result: PatientsTableResult = { status: "failed", error: "Unable to load patients." };
		return Response.json(result, { status: 500 });
	}
}
