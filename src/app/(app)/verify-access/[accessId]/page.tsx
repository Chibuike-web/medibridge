import { Suspense } from "react";
import { VerifyAccessClient } from "./verify-access-client";
import { getAccessVerificationState } from "@/lib/api/get-access-verification-state";

export const metadata = {
	title: "Verify Access",
};

type VerifyAccessPageProps = {
	params: Promise<{ accessId: string }>;
};

export default function VerifyAccessPage({ params }: VerifyAccessPageProps) {
	return (
		<Suspense fallback={<VerifyAccessPageSkeleton />}>
			<VerifyAccessContent params={params} />
		</Suspense>
	);
}

async function VerifyAccessContent({ params }: VerifyAccessPageProps) {
	const { accessId } = await params;
	const verificationState = await getAccessVerificationState(accessId);

	return (
		<main className="grid min-h-dvh place-items-center px-6 py-10">
			<VerifyAccessClient accessId={accessId} verificationState={verificationState} />
		</main>
	);
}

function VerifyAccessPageSkeleton() {
	return (
		<main className="grid min-h-dvh place-items-center px-6 py-10">
			<div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6">
				<div className="h-7 w-48 rounded bg-gray-100" />
				<div className="mt-4 h-4 w-full rounded bg-gray-100" />
				<div className="mt-2 h-4 w-4/5 rounded bg-gray-100" />
				<div className="mt-8 h-11 rounded bg-gray-100" />
			</div>
		</main>
	);
}
