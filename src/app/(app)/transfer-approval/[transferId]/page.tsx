import { Suspense } from "react";
import { TransferApprovalClient, TransferApprovalResult } from "./transfer-approval-client";
import { getTransferApproval } from "@/lib/api/get-transfer-approval";
import { verifyTransferApprovalToken } from "@/lib/api/transfer-approval-token";
import { getStringParam } from "@/lib/utils/search-params";

export const metadata = {
	title: "Transfer Approval",
};

type TransferApprovalPageProps = Pick<
	PageProps<"/transfer-approval/[transferId]">,
	"params" | "searchParams"
>;

export default function TransferApprovalPage({ params, searchParams }: TransferApprovalPageProps) {
	return (
		<Suspense fallback={<TransferApprovalPageSkeleton />}>
			<TransferApprovalContent params={params} searchParams={searchParams} />
		</Suspense>
	);
}

async function TransferApprovalContent({ params, searchParams }: TransferApprovalPageProps) {
	const [{ transferId }, { token: tokenParam }] = await Promise.all([params, searchParams]);
	const token = getStringParam(tokenParam);
	const approvalToken = await verifyTransferApprovalToken(token, transferId);
	const transfer = approvalToken ? await getTransferApproval(transferId) : null;

	if (
		transfer?.patientApprovalStatus === "approved" ||
		transfer?.patientApprovalStatus === "rejected"
	) {
		return (
			<TransferApprovalResult
				patientApprovalStatus={transfer.patientApprovalStatus}
				sourceHospitalName={transfer.sourceHospitalName}
				targetHospitalName={transfer.targetHospitalName}
				accessEndsAt={transfer.accessEndsAt}
				patientRejectionReason={transfer.patientRejectionReason}
			/>
		);
	}

	if (transfer) {
		return <TransferApprovalClient transfer={transfer} approvalToken={token} />;
	}

	return (
		<main className="bg-white px-6 py-10">
			<section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-3xl items-center justify-center text-center">
				<div>
					<h1 className="text-lg font-semibold text-gray-800 text-balance">
						Invalid transfer link
					</h1>
					<p className="mt-4 text-sm text-gray-600">
						This patient transfer approval link is invalid. Contact the requesting hospital for a
						new link.
					</p>
				</div>
			</section>
		</main>
	);
}

function TransferApprovalPageSkeleton() {
	return (
		<main className="mt-12 px-6">
			<div className="mx-auto flex max-w-[75rem] flex-col gap-6">
				<div className="h-8 w-64 rounded bg-gray-100" />
				<div className="h-48 rounded-lg border border-gray-200 bg-gray-50" />
				<div className="grid gap-3">
					<div className="h-12 rounded bg-gray-100" />
					<div className="h-12 rounded bg-gray-100" />
					<div className="h-12 rounded bg-gray-100" />
				</div>
			</div>
		</main>
	);
}
