import { ReviewExtractedInfoClient } from "./review-extracted-info-client";
import { verifySession } from "@/lib/api/verify-session";

export const metadata = {
	title: "Review Extracted Info",
};

export default async function ReviewExtractedInfo() {
	await verifySession();

	return <ReviewExtractedInfoClient />;
}
