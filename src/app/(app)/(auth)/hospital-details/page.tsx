import { Suspense } from "react";
import { HospitalDetailsClient } from "./hospital-details-client";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Hospital Details",
};

export default function HospitalDetails() {
	return (
		<main className="h-dvh overflow-y-auto">
			<Suspense fallback={null}>
				<HospitalDetailsContent />
			</Suspense>
		</main>
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
		<div className="max-w-[31.25rem] min-h-full grid place-items-center mx-auto px-6 md:px-0 py-10">
			<div className="w-full">
				<HospitalDetailsClient />
			</div>
		</div>
	);
}
