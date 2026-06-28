import { getPatients } from "@/lib/api/get-patients";
import { verifySession } from "@/lib/api/verify-session";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	await verifySession();

	const pageParam = request.nextUrl.searchParams.get("page") ?? "1";
	const limitParam = request.nextUrl.searchParams.get("limit") ?? "20";
	const page = parsePositiveInteger(pageParam, 1);
	const limit = parsePositiveInteger(limitParam, 20);
	const { patients, totalPatients } = await getPatients(page, limit);

	return NextResponse.json({
		patients,
		page,
		totalPages: Math.ceil(totalPatients / limit) || 1,
	});
}

function parsePositiveInteger(value: string, fallback: number) {
	const parsedValue = parseInt(value, 10);

	return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}
