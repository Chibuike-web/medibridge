import { AddNewPatientClient } from "@/app/(app)/dashboard/add-new-patient/add-new-patient-client";
import Link from "next/link";
import { RiArrowLeftLine } from "@remixicon/react";
import { verifySession } from "@/lib/api/verify-session";
import { Suspense } from "react";
import { Route } from "next";
import { getStringParam } from "@/lib/utils/search-params";

export const metadata = {
	title: "Add New Patient",
};

type AddNewPatientPageProps = Pick<PageProps<"/dashboard/add-new-patient">, "searchParams">;

export default async function AddNewPatient({ searchParams }: AddNewPatientPageProps) {
	return (
		<Suspense>
			<AddNewPatientContent searchParams={searchParams} />
		</Suspense>
	);
}

async function AddNewPatientContent({ searchParams }: AddNewPatientPageProps) {
	const { returnTo } = await searchParams;
	const safeReturnTo = getSafeReturnTo(getStringParam(returnTo));
	await verifySession();

	return (
		<>
			<nav className="w-full h-14 flex items-center sticky z-1 top-0 bg-white border-b border-gray-300 px-6">
				<Link href={safeReturnTo} className="flex gap-2 w-max items-center text-foreground">
					<RiArrowLeftLine className="size-4" /> <span className="sr-only">Back</span>
				</Link>
			</nav>

			<main className="flex flex-col gap-9 mt-12 max-w-[37.5rem] mx-auto px-6 md:px-0">
				<div>
					<h1 className="mb-6 text-center text-xl font-semibold">Upload Patient’s Record</h1>
					<p className="text-gray-600 text-center text-balance">
						Upload a document with the patient’s basic details to create their profile. Only
						essential personal information is needed at this stage. Upload one document per patient.
					</p>
				</div>
				<AddNewPatientClient />
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
