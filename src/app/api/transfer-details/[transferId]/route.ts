import { getTransferDetails } from "@/lib/api/get-transfer-details";
import { verifySession } from "@/lib/api/verify-session";
import { NextResponse } from "next/server";

export async function GET(
	_request: Request,
	context: RouteContext<"/api/transfer-details/[transferId]">,
) {
	await verifySession();

	const { transferId } = await context.params;
	const transfer = await getTransferDetails(transferId);

	if (!transfer) {
		return NextResponse.json({ transfer: null }, { status: 404 });
	}

	return NextResponse.json({ transfer });
}
