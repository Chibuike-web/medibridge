import { Suspense } from "react";
import { AdminInviteClient } from "./admin-invite-client";
import { getOrganizationContext } from "@/lib/api/get-organization-id";
import { verifySession } from "@/lib/api/verify-session";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Admin Invite",
};

export default function AdminInvite() {
	return (
		<main className="h-dvh overflow-y-auto">
			<div className="max-w-[31.25rem] min-h-full grid place-items-center mx-auto px-6 md:px-0 py-10">
				<Suspense>
					<AdminInviteContent />
				</Suspense>
			</div>
		</main>
	);
}

async function AdminInviteContent() {
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

	if (organizationContext.role !== "owner") {
		redirect("/dashboard/overview");
	}

	return (
		<div className="w-full">
			<AdminInviteClient />
		</div>
	);
}
