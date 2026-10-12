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
	if (!extractionId) {
		redirect("/dashboard/add-new-patient");
	}

	const extractionIds = [...new Set(Array.isArray(extractionId) ? extractionId : [extractionId])];
	if (extractionIds.some((id) => !id.trim())) {
		notFound();
	}

	const extractions = await Promise.all(extractionIds.map((id) => getPatientExtractionById(id)));
	const documents = extractions.flatMap((extraction) => {
		if (!extraction) {
			notFound();
		}
		return extraction.extractedData.map(({ documentId, ...patient }) => ({
			id: documentId,
			fileUrl: `/api/patient-extractions/${extraction.id}/documents/${encodeURIComponent(documentId)}`,
			patient,
		}));
	});

	return (
		<ReviewExtractedInfoClient
			key={extractionIds.join(",")}
			initialDocuments={documents.map((document, index) => ({
				...document,
				label: `Document ${index + 1}`,
				status: "ready",
			}))}
		/>
	);
}
