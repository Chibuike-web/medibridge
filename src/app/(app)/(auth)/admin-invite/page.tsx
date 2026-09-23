import { AdminInviteClient } from "./admin-invite-client";
import { getOrganizationContext } from "@/lib/api/get-organization-id";
import { verifySession } from "@/lib/api/verify-session";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Admin Invite",
};

export default async function AdminInvite() {
	await verifySession();

	const organizationContext = await getOrganizationContext();

	if (!organizationContext?.isOrganizationVerified) {
		redirect("/verify");
	}

	if (organizationContext.role !== "owner") {
		redirect("/dashboard/overview");
	}

	return (
		<main className="max-w-[37.5rem] min-h-dvh grid place-items-center mx-auto px-6 md:px-0 my-10">
			<div className="w-full">
				<h1 className="mt-10 text-center text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800">
					Invite Administrator
				</h1>
				<p className="text-gray-600 text-sm font-medium text-center text-balance mt-4">
					Invite your hospital’s administrator. They will be assigned an admin role to manage and
					add new members.
				</p>
				<AdminInviteClient />
			</div>
		</main>
	);
}
