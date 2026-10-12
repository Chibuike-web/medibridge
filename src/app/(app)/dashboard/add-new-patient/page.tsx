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
			<nav className="w-full h-14 flex items-center sticky z-1 top-0 bg-white border-b border-gray-100 px-4 md:px-8">
				<Button variant="ghost" size="icon" asChild>
					<Link href={safeReturnTo} prefetch={true}>
						<RiArrowLeftLine aria-hidden="true" /> <span className="sr-only">Back</span>
					</Link>
				</Button>
			</nav>

			<AddNewPatientClient />
		</>
	);
}

function getSafeReturnTo(value: string | undefined): Route {
	if (!value) return "/dashboard/transfers";
	if (!value.startsWith("/dashboard/")) return "/dashboard/transfers";
	if (value.startsWith("//")) return "/dashboard/transfers";

	return value as Route;
}
