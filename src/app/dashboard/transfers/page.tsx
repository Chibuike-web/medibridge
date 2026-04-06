import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TransfersClient } from "./transfers-client";
import { transferRecords } from "@/features/transfers/data";

export default function Transfers() {
	return transferRecords.length > 0 ? (
		<TransfersClient />
	) : (
		<div className="h-full">
			<div className="w-full mx-auto max-w-7xl flex items-center justify-center h-full p-10">
				<div className="flex flex-col items-center max-w-[37.5rem]">
					<h1 className="font-semibold text-2xl text-center mb-6">No transfers yet</h1>
					<p className="mb-12 text-center">
						Start by creating your first transfer request to move patient records securely.
					</p>
					<Button className="h-11" asChild>
						<Link href="/dashboard/new-transfer-request">Create transfer request </Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
