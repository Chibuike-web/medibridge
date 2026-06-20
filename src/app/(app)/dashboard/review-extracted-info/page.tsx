import { ReviewExtractedInfoClient } from "./review-extracted-info-client";
import { verifySession } from "@/lib/api/verify-session";
import { Suspense } from "react";

export const metadata = {
	title: "Review Extracted Info",
};

export default async function ReviewExtractedInfo() {
	return (
		<Suspense fallback={<ReviewExtractedInfoPageSkeleton />}>
			<ReviewExtractedInfoContent />
		</Suspense>
	);
}

async function ReviewExtractedInfoContent() {
	await verifySession();

	return <ReviewExtractedInfoClient />;
}

function ReviewExtractedInfoPageSkeleton() {
	return (
		<main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
			<div className="h-8 w-64 rounded bg-gray-100" />
			<div className="h-64 rounded-lg border border-gray-200 bg-gray-50" />
		</main>
	);
}
