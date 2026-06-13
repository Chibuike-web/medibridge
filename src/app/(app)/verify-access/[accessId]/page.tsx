import { VerifyAccessClient } from "./verify-access-client";
import { getAccessVerificationState } from "@/lib/api/get-access-verification-state";

export const metadata = {
	title: "Verify Access",
};

type VerifyAccessPageProps = {
	params: Promise<{ accessId: string }>;
};

export default async function VerifyAccessPage({ params }: VerifyAccessPageProps) {
	const { accessId } = await params;
	const verificationState = await getAccessVerificationState(accessId);

	return (
		<main className="grid min-h-dvh place-items-center px-6 py-10">
			<VerifyAccessClient accessId={accessId} verificationState={verificationState} />
		</main>
	);
}
