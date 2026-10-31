import { cleanupAbandonedExtractionsService } from "@/services/patient/cleanup-abandoned-extractions-service";
import { cleanupUnreferencedUploadsService } from "@/services/patient/cleanup-unreferenced-uploads-service";

export async function GET(request: Request) {
	const cronSecret = process.env.CRON_SECRET;

	if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
		return Response.json({ status: "failed", error: "Unauthorized." }, { status: 401 });
	}

	const abandonedReviews = await cleanupAbandonedExtractionsService();
	const unreferencedUploads = await cleanupUnreferencedUploadsService();

	if (abandonedReviews.status === "failed") {
		return Response.json(abandonedReviews, { status: 500 });
	}

	if (unreferencedUploads.status === "failed") {
		return Response.json(unreferencedUploads, { status: 500 });
	}

	return Response.json({
		status: "success",
		removedReviews: abandonedReviews.removedCount,
		removedUploads: unreferencedUploads.removedCount,
	});
}
