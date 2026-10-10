import { Suspense } from "react";
import Image from "next/image";
import { VerifyClient } from "./verify-client";
import { auth } from "@/lib/better-auth/auth";
import { getOrganizationContext } from "@/lib/api/get-organization-id";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Verify",
};

export default function Verify() {
	return (
		<main className="h-dvh overflow-y-auto">
			<div className="max-w-[31.25rem] min-h-full grid place-items-center mx-auto px-6 md:px-0 py-10">
				<Suspense>
					<VerifyContent />
				</Suspense>
			</div>
		</main>
	);
}

async function VerifyContent() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) {
		redirect("/sign-in");
	}

	const organizationContext = await getOrganizationContext();
	if (!organizationContext) {
		redirect("/hospital-details");
	}

	if (organizationContext?.isOrganizationVerified && session.user.emailVerified) {
		redirect("/admin-invite");
	}
	return (
		<div className="flex flex-col items-center">
			<Image src="/assets/verification-icon.svg" width={120} height={120} alt="" />

			<h1 className="mt-10 text-center text-lg font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800 text-balance">
				Hospital verification
			</h1>
			<p className="text-gray-600 text-sm font-medium text-center text-pretty mt-4">
				We received your hospital details and accreditation document. You can leave this page. We’ll
				email you when the review is complete.
			</p>
			<VerifyClient />
		</div>
	);
}
