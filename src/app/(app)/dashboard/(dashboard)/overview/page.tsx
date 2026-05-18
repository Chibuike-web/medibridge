import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RiAddLine } from "@remixicon/react";
import { getTotalPatient } from "@/lib/api/get-total-patient";
import { getTotalPendingTransfers } from "@/lib/api/get-total-pending-transfers";
import { getTotalTransfers } from "@/lib/api/get-total-transfers";
import { RecentPatientsTable } from "@/features/patients/components/recent-patients-table";
import { RecentTransfersTable } from "@/features/transfers/components/recent-transfers-table";
import { Suspense } from "react";
import { Cards } from "./cards";
import { getRecentPatients } from "@/lib/api/get-recent-patients";
import { getRecentTransfer } from "@/lib/api/get-recent-transfers";

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
		<div className="flex h-full flex-col">
			<header className="sticky top-0 z-20 flex h-16 shrink-0 items-center border-b border-gray-200 bg-white px-8">
				<h1 className="text-xl font-semibold tracking-[-0.015em] text-gray-800">Overview</h1>
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto">
				<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
					<Cards stats={stats} />
					<Suspense>
						<RecentPatients />
					</Suspense>
					<Suspense>
						<RecentTransfers />
					</Suspense>
				</section>
			</div>
		</div>
	) : (
		<div className="mx-auto flex h-full w-full max-w-7xl items-center justify-center p-10">
			<div className="flex max-w-xl flex-col items-center">
				<h1 className="mb-6 text-center text-2xl font-semibold text-gray-800">No Patients Yet</h1>

				<p className="mb-12 text-center text-gray-600">
					You have not added any patients to your list yet. Start by creating a new patient profile.
				</p>

				<Button className="h-11" asChild>
					<Link href="/dashboard/add-new-patient">
						<RiAddLine className="size-6" />
						Add New Patient
					</Link>
				</Button>
			</div>
		</div>
	);
}

async function RecentPatients() {
	const recentPatients = await getRecentPatients();

	return <RecentPatientsTable data={recentPatients} />;
}

async function RecentTransfers() {
	const recentTransfers = await getRecentTransfer();
	return <RecentTransfersTable data={recentTransfers} />;
}
