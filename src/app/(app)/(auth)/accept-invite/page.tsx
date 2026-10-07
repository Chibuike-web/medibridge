import { Suspense } from "react";
import { auth } from "@/lib/better-auth/auth";
import { getInvitationPreviewService } from "@/services/auth/accept-invite-service";
import { headers } from "next/headers";
import { AcceptInviteClient, type AcceptInviteMode } from "./accept-invite-client";

export const metadata = {
	title: "Accept Invite",
};

type AcceptInviteProps = {
	searchParams: Promise<{ invitationId?: string | string[] }>;
};

export default function AcceptInvite({ searchParams }: AcceptInviteProps) {
	return (
		<main className="h-dvh overflow-y-auto">
			<div className="max-w-[31.25rem] min-h-full grid place-items-center mx-auto px-6 md:px-0 py-10">
				<Suspense>
					<AcceptInviteContent searchParams={searchParams} />
				</Suspense>
			</div>
		</main>
	);
}

async function AcceptInviteContent({ searchParams }: AcceptInviteProps) {
	const { invitationId: invitationIdValue } = await searchParams;
	const invitationId = Array.isArray(invitationIdValue) ? invitationIdValue[0] : invitationIdValue;
	const [invitationPreview, session] = await Promise.all([
		getInvitationPreviewService(invitationId ?? ""),
		auth.api.getSession({ headers: await headers() }),
	]);

	if (invitationPreview.status === "invalid") {
		return (
			<div className="w-full text-center">
				<h1 className="text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800 text-balance">
					Invitation unavailable
				</h1>
				<p className="mt-4 text-sm font-medium text-gray-600">
					This invitation is invalid, expired, or has already been used.
				</p>
			</div>
		);
	}

	const isInvitedAccount =
		session?.user.email.toLowerCase() === invitationPreview.email.toLowerCase();
	let mode: AcceptInviteMode = invitationPreview.hasAccount ? "verify-email" : "create-account";

	if (session && !isInvitedAccount) {
		mode = "wrong-account";
	} else if (session?.user.emailVerified && isInvitedAccount) {
		mode = "accept";
	}

	const pageContent = {
		"create-account": {
			heading: "Complete Account Setup",
			description: `Your invited email for ${invitationPreview.organizationName} is pre-filled. Verify it to finish account setup.`,
		},
		"verify-email": {
			heading: "Verify Your Email",
			description: `Verify ${invitationPreview.email}, then sign in to accept the invitation to ${invitationPreview.organizationName}.`,
		},
		accept: {
			heading: "Accept Hospital Invitation",
			description: `Your email is verified. Accept the invitation to join ${invitationPreview.organizationName}.`,
		},
		"wrong-account": {
			heading: "Use the Invited Account",
			description: `This invitation belongs to ${invitationPreview.email}. Switch accounts to continue.`,
		},
	}[mode];

	return (
		<div className="w-full">
			<div className="mb-10">
				<h1 className="text-center text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800 text-balance">
					{pageContent.heading}
				</h1>
				<p className="mt-4 text-pretty text-center text-sm font-medium text-gray-600">
					{pageContent.description}
				</p>
			</div>

			<AcceptInviteClient
				email={invitationPreview.email}
				invitationId={invitationId ?? ""}
				mode={mode}
				organizationName={invitationPreview.organizationName}
			/>
		</div>
	);
}
