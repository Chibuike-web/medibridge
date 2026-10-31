import { cleanupAbandonedExtractionsService } from "@/services/patient/cleanup-abandoned-extractions-service";

export async function GET(request: Request) {
	const cronSecret = process.env.CRON_SECRET;

	if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
		return Response.json({ status: "failed", error: "Unauthorized." }, { status: 401 });
	}

	const result = await cleanupAbandonedExtractionsService();

	return Response.json(result, { status: result.status === "success" ? 200 : 500 });
}
