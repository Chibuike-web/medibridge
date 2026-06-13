import { TransferApprovalClient } from "./transfer-approval-client";
import { getTransferApproval } from "@/lib/api/get-transfer-approval";

export const metadata = {
	title: "Transfer Approval",
};

type TransferApprovalPageProps = {
	params: Promise<{ transferId: string }>;
};

export default async function TransferApprovalPage({ params }: TransferApprovalPageProps) {
	const { transferId } = await params;
	const transfer = await getTransferApproval(transferId);

	return (
		<main className="bg-white px-6 py-10">
			{transfer ? (
				<div className="mx-auto w-full max-w-3xl">
					<TransferApprovalClient transfer={transfer} />
				</div>
			) : (
				<section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-3xl items-center justify-center text-center">
					<div>
						<h1 className="text-2xl font-semibold text-gray-800">Invalid transfer link</h1>
						<p className="mt-4 text-base text-gray-600">
							This patient transfer approval link is invalid. Contact the requesting hospital for a
							new link.
						</p>
					</div>
				</section>
			)}
		</main>
	);
}
