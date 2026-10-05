import { Suspense } from "react";
import Link from "next/link";
import { HospitalDetailsClient } from "./hospital-details-client";
import { RiArrowLeftLine } from "@remixicon/react";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Hospital Details",
};

export default function HospitalDetails() {
	return (
		<>
			<nav className="w-full h-16 flex items-center sticky top-0 bg-white border-b border-gray-300 px-8">
				<Link href="/sign-in" className="flex gap-2 w-max items-center text-foreground">
					<RiArrowLeftLine className="size-4" /> <span className="sr-only">Back</span>
				</Link>
			</nav>
			<main className="max-w-[31.25rem] min-h-[calc(100dvh-4rem)] grid place-items-center mx-auto px-6 md:px-0 my-10">
				<Suspense>
					<HospitalDetailsContent />
				</Suspense>
			</main>
		</>
	);
}

async function HospitalDetailsContent() {
	const requestHeaders = await headers();
	const session = await auth.api.getSession({ headers: requestHeaders });
	if (!session) redirect("/sign-in");
	if (!session.user.emailVerified) redirect("/email-verified?error=unverified");

	const organizations = await auth.api.listOrganizations({ headers: requestHeaders });
	if (organizations.length > 0) redirect("/sign-in");

	return (
		<div className="w-full">
			<div className="mb-10">
				<h1 className="text-center text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800">
					Hospital Details
				</h1>
				<p className="text-gray-600 text-sm font-medium text-center text-balance mt-4">
					Fill in your hospital’s registered details and provide an accreditation or license for
					verification.
				</p>
			</div>
			<HospitalDetailsClient />
		</div>
	);
}
