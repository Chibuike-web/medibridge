import Link from "next/link";
import { NewTransferRequestClient } from "@/app/(app)/dashboard/new-transfer-request/new-transfer-request-client";
import { RiArrowLeftLine } from "@remixicon/react";
import { Suspense } from "react";
import { verifySession } from "@/lib/api/verify-session";
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

export default async function NewTransferRequest({
	searchParams,
}: NewTransferRequestPageProps) {
	return (
		<Suspense>
			<NewTransferRequestContent searchParams={searchParams} />
		</Suspense>
	);
}

async function NewTransferRequestContent({
	searchParams,
}: NewTransferRequestPageProps) {
	await verifySession();
	const { returnTo } = await searchParams;
	const safeReturnTo = getSafeReturnTo(getStringParam(returnTo));
	const { patients, totalPatients } = await getPatients(1, PATIENT_OPTIONS_LIMIT);
	const totalPatientPages = Math.max(1, Math.ceil(totalPatients / PATIENT_OPTIONS_LIMIT));

	return (
		<>
			<nav className="w-full h-14 flex items-center sticky z-[20] top-0 bg-white border-b border-gray-300 px-6">
				<Link href={safeReturnTo} className="flex gap-2 w-max items-center text-foreground">
					<RiArrowLeftLine className="size-4" /> <span className="sr-only">Back</span>
				</Link>
			</nav>
			<main className="flex flex-col gap-8 my-12 max-w-[37.5rem] w-full mx-auto px-6 md:px-0">
				<h1 className="text-center text-xl font-semibold">New Transfer Request</h1>
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
