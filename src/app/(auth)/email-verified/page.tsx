import { Suspense } from "react";
import EmailVerifiedClient from "./email-verified-client";

export default function EmailVerified() {
	return (
		<Suspense>
			<EmailVerifiedClient />
		</Suspense>
	);
}
