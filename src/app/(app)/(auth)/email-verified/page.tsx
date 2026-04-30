import { Suspense } from "react";
import { EmailVerifiedClient } from "./email-verified-client";

export const metadata = {
	title: "Email Verified",
};

export default function EmailVerified() {
	return (
		<Suspense>
			<EmailVerifiedClient />
		</Suspense>
	);
}
