import { ReviewExtractedInfoClient } from "./review-extracted-info-client";
import { verifySession } from "@/lib/api/verify-session";
import { Suspense } from "react";

export const metadata = {
	title: "Review Extracted Info",
};

export default async function ReviewExtractedInfo() {
	return (
		<Suspense>
			<ReviewExtractedInfoContent />
		</Suspense>
	);
}

async function ReviewExtractedInfoContent() {
	await verifySession();

	return <ReviewExtractedInfoClient />;
}
