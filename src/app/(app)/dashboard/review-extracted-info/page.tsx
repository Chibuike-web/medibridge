import { getOrganizationContext } from "@/lib/api/get-organization-id";
import { ReviewExtractedInfoClient } from "./review-extracted-info-client";
import { verifySession } from "@/lib/api/verify-session";
import { getPatientExtractionById } from "@/lib/api/get-patient-extraction-by-id";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = {
	title: "Review Extracted Info",
};

type ReviewExtractedInfoPageProps = Pick<
	PageProps<"/dashboard/review-extracted-info">,
	"searchParams"
>;

export default function ReviewExtractedInfo({ searchParams }: ReviewExtractedInfoPageProps) {
	return (
		<Suspense>
			<ReviewExtractedInfoContent searchParams={searchParams} />
		</Suspense>
	);
}

async function ReviewExtractedInfoContent({ searchParams }: ReviewExtractedInfoPageProps) {
	const session = await verifySession();

	if (!session.user.emailVerified) {
		redirect("/email-verified?error=unverified");
	}

	const organizationContext = await getOrganizationContext();
	if (!organizationContext) {
		redirect("/sign-in");
	}

	if (!organizationContext.isOrganizationVerified) {
		redirect("/verify");
	}

	const { extractionId } = await searchParams;
	if (typeof extractionId !== "string") {
		redirect("/dashboard/add-new-patient/bulk");
	}

	const extraction = await getPatientExtractionById(extractionId);
	if (!extraction) {
		notFound();
	}

	return (
		<ReviewExtractedInfoClient
			extractionId={extraction.id}
			initialDocuments={extraction.extractedData.map(({ documentId, status, patient }, index) => ({
				id: documentId,
				label: `Document ${index + 1}`,
				fileUrl: `/api/patient-extractions/${extraction.id}/documents/${encodeURIComponent(documentId)}`,
				status,
				patient,
			}))}
		/>
	);
}
