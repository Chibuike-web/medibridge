import { getPatients } from "@/lib/api/get-patients";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";

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

	const { searchParams } = new URL(request.url);
	const pageParam = searchParams.get("page") ?? "1";
	const limitParam = searchParams.get("limit") ?? "20";
	const page = parsePositiveInteger(pageParam, 1);
	const limit = parsePositiveInteger(limitParam, 20);
	const { patients, totalPatients } = await getPatients(page, limit);

	return Response.json({
		patients,
		page,
		totalPages: Math.ceil(totalPatients / limit) || 1,
	});
}

function parsePositiveInteger(value: string, fallback: number) {
	const parsedValue = parseInt(value, 10);

	return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}
