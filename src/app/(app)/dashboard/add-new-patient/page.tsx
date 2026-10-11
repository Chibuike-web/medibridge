import { Button } from "@/components/ui/button";
import { AddNewPatientClient } from "@/app/(app)/dashboard/add-new-patient/add-new-patient-client";
import Link from "next/link";
import { RiArrowLeftLine } from "@remixicon/react";
import { Suspense } from "react";
import { Route } from "next";
import { getStringParam } from "@/lib/utils/search-params";
import { getOrganizationContext } from "@/lib/api/get-organization-id";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/api/verify-session";

export const metadata = {
	title: "Add New Patient",
};

type AddNewPatientPageProps = Pick<PageProps<"/dashboard/add-new-patient">, "searchParams">;

export default function AddNewPatient({ searchParams }: AddNewPatientPageProps) {
	return (
		<Suspense>
			<AddNewPatientContent searchParams={searchParams} />
		</Suspense>
	);
}

async function AddNewPatientContent({ searchParams }: AddNewPatientPageProps) {
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

	return (
		<>
			<nav className="w-full h-14 flex items-center sticky z-1 top-0 bg-white border-b border-gray-300 px-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href={safeReturnTo} prefetch={true}>
						<RiArrowLeftLine aria-hidden="true" /> <span className="sr-only">Back</span>
					</Link>
				</Button>
			</nav>

			<main className="flex flex-col gap-9 mt-12 max-w-[31.25rem] mx-auto px-6 md:px-0">
				<div>
					<h1 className="mb-3 text-center text-lg font-semibold text-balance">
						Upload Patient’s Record
					</h1>
					<p className="text-gray-600 text-center text-pretty text-sm">
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
