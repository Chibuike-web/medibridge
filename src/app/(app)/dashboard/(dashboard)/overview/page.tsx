import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RecentPatientsTable } from "@/features/patients/components/recent-patients-table";
import { RecentTransfersTable } from "@/features/transfers/components/recent-transfers-table";
import { Suspense } from "react";
import { Cards } from "./cards";
import { getRecentPatients } from "@/lib/api/get-recent-patients";
import { getRecentTransfer } from "@/lib/api/get-recent-transfers";
import { getOverviewStats } from "@/lib/api/get-overview-stats";
import Image from "next/image";

export const metadata = {
	title: "Overview",
};

export default async function Overview() {
	const stats = await getOverviewStats();

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
		<div className="w-full mx-auto max-w-7xl flex items-center justify-center h-full p-10">
			<div className="relative flex w-[31.25rem] max-w-full items-end justify-center">
				<Image
					src="/assets/empty-state.svg"
					alt=""
					aria-hidden="true"
					width={500}
					height={336}
					className="h-auto w-[31.25rem] max-w-full"
				/>
				<div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center text-center">
					<h1 className="font-semibold text-2xl text-center mb-6">No patient records available</h1>
					<p className="mb-12 text-center">
						You haven’t added any patient records yet. Create a new patient profile to get started.
					</p>
					<Button className="h-11" asChild>
						<Link href="/dashboard/add-new-patient">Add patient </Link>
					</Button>
				</div>
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
