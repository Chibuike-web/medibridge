import { getTransfers } from "@/lib/api/get-transfers";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getNumberParam, parseDateBoundaryParam } from "@/lib/utils/search-params";
import type { TransferType, TransferStatusFilter } from "@/features/transfers/types";

export type TransfersTableResult =
	| {
			status: "success";
			transfers: TransferType[];
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
	const requestedAtFilter = {
		from: parseDateBoundaryParam(searchParams.get("requestedFrom") ?? "", "start"),
		to: parseDateBoundaryParam(searchParams.get("requestedTo") ?? "", "end"),
	};
	const statusFilters = (searchParams.get("status") ?? "")
		.split(",")
		.filter((value): value is TransferStatusFilter =>
			["pending", "rejected", "completed", "failed", "cancelled"].includes(value),
		);
	try {
		const { transfers, totalTransfers } = await getTransfers(
			page,
			limit,
			query,
			requestedAtFilter,
			statusFilters,
		);
		const result: TransfersTableResult = {
			status: "success",
			transfers,
			page,
			limit,
			totalPages: Math.ceil(totalTransfers / limit) || 1,
		};
		return Response.json(result);
	} catch (error) {
		console.error("Loading transfers failed:", error);
		const result: TransfersTableResult = { status: "failed", error: "Unable to load transfers." };
		return Response.json(result, { status: 500 });
	}
}
