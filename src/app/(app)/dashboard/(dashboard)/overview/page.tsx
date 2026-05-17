import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OverviewClient } from "./overview-client";
import { StatContextProvider } from "./stats-context";
import { RiAddLine } from "@remixicon/react";
import { getTotalPatient } from "@/lib/api/get-total-patient";
import { getTotalPendingTransfers } from "@/lib/api/get-total-pending-transfers";
import { getTotalTransfers } from "@/lib/api/get-total-transfers";

export const metadata = {
	title: "Overview",
};

export default async function Overview() {
	const [patients, transfers, pendingTransfers] = await Promise.all([
		getTotalPatient(),
		getTotalTransfers(),
		getTotalPendingTransfers(),
	]);

	const stats = {
		...patients,
		...transfers,
		...pendingTransfers,
	};

	return stats.hasPatients ? (
		<StatContextProvider stats={stats}>
			<OverviewClient />
		</StatContextProvider>
	) : (
		<div className="mx-auto flex w-full max-w-7xl h-full items-center justify-center p-10">
			<div className="flex max-w-xl flex-col items-center">
				<h1 className="mb-6 text-center text-2xl font-semibold text-balance text-gray-800">
					No Patients Yet
				</h1>
				<p className="mb-12 text-center text-pretty text-gray-600">
					You have not added any patients to your list yet. Start by creating a new patient profile.
				</p>
				<Button className="h-11" asChild>
					<Link href="/dashboard/add-new-patient">
						<RiAddLine className="size-6" /> Add New Patient
					</Link>
				</Button>
			</div>
		</div>
	);
}
