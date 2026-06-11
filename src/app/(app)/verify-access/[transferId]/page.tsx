import { VerifyAccessClient } from "./verify-access-client";

export const metadata = {
	title: "Verify Access",
};

export default function VerifyAccessPage() {
	return (
		<main className="grid min-h-dvh place-items-center px-6 py-10">
			<VerifyAccessClient recipientEmail="hospitalb@example.com" />
		</main>
	);
}
