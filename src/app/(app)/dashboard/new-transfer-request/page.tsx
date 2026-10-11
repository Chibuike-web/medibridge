import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NewTransferRequestClient } from "@/app/(app)/dashboard/new-transfer-request/new-transfer-request-client";
import { RiArrowLeftLine } from "@remixicon/react";
import { Suspense } from "react";
import { verifySession } from "@/lib/api/verify-session";
import { getOrganizationContext } from "@/lib/api/get-organization-id";
import { redirect } from "next/navigation";
import { getPatients } from "@/lib/api/get-patients";
import { getStringParam } from "@/lib/utils/search-params";
import type { Route } from "next";

export const metadata = {
	title: "New Transfer Request",
};

const PATIENT_OPTIONS_LIMIT = 20;

type NewTransferRequestPageProps = Pick<
	PageProps<"/dashboard/new-transfer-request">,
	"searchParams"
>;

export default function NewTransferRequest({ searchParams }: NewTransferRequestPageProps) {
	return (
		<Suspense>
			<NewTransferRequestContent searchParams={searchParams} />
		</Suspense>
	);
}

async function NewTransferRequestContent({ searchParams }: NewTransferRequestPageProps) {
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

	const { returnTo } = await searchParams;
	const safeReturnTo = getSafeReturnTo(getStringParam(returnTo));
	const { patients, totalPatients } = await getPatients(1, PATIENT_OPTIONS_LIMIT);
	const totalPatientPages = Math.max(1, Math.ceil(totalPatients / PATIENT_OPTIONS_LIMIT));

	return (
		<>
			<nav className="w-full flex items-center sticky z-[20] top-0 bg-white border-b border-gray-300 p-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href={safeReturnTo} prefetch={true}>
						<RiArrowLeftLine aria-hidden="true" /> <span className="sr-only">Back</span>
					</Link>
				</Button>
			</nav>
			<main className="flex flex-col gap-8 my-12 max-w-[31.25rem] w-full mx-auto px-6 md:px-0">
				<h1 className="text-center text-lg font-semibold text-balance">New Transfer Request</h1>
				<Suspense>
					<NewTransferRequestClient
						searchParams={searchParams}
						patients={patients}
						patientOptionsLimit={PATIENT_OPTIONS_LIMIT}
						totalPatientPages={totalPatientPages}
					/>
				</Suspense>
			</main>
		</>
	);
}

function getSafeReturnTo(value: string | undefined): Route {
	if (!value) return "/dashboard/transfers";
	if (!value.startsWith("/dashboard/")) return "/dashboard/transfers";
	if (value.startsWith("//")) return "/dashboard/transfers";

	return value as Route;
}
