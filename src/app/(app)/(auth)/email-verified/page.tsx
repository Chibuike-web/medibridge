import { Suspense } from "react";
import { EmailVerifiedClient } from "./email-verified-client";
import { getSessionData } from "@/lib/api/get-session-data";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Email Verified",
};

type EmailVerifiedProps = {
	searchParams: Promise<{ error?: string | string[] }>;
};

export default function EmailVerified({ searchParams }: EmailVerifiedProps) {
	return (
		<Suspense>
			<EmailVerifiedContent searchParams={searchParams} />
		</Suspense>
	);
}

async function EmailVerifiedContent({ searchParams }: EmailVerifiedProps) {
	const { error } = await searchParams;
	const verificationError = Array.isArray(error) ? error[0] : error;
	if (verificationError) return <EmailVerifiedClient />;

	const session = await getSessionData();
	if (!session) redirect("/email-verified?error=no_session");
	if (!session.user.emailVerified) redirect("/email-verified?error=unverified");

	return <EmailVerifiedClient />;
}
