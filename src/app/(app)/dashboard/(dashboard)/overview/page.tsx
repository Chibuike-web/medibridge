import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OverviewStats } from "@/services/patient/types";
import { OverviewClient } from "./overview-client";
import { StatContextProvider } from "./stats-context";
import { RiAddLine } from "@remixicon/react";

export const metadata = {
	title: "Overview",
};

const baseDate = new Date();

const previewPatientCreatedAt = [
	...Array.from({ length: 6 }, (_, index) => {
		const date = new Date(baseDate);
		date.setDate(date.getDate() - index - 1);
		return date.toISOString();
	}),
	...Array.from({ length: 122 }, (_, index) => {
		const date = new Date(baseDate);
		date.setDate(date.getDate() - index * 2);
		return date.toISOString();
	}),
];

const previewPatientTransferredAt = [
	...Array.from({ length: 4 }, (_, index) => {
		const date = new Date(baseDate);
		date.setDate(date.getDate() - index - 1);
		return date.toISOString();
	}),
	...Array.from({ length: 14 }, (_, index) => {
		const date = new Date(baseDate);
		date.setDate(date.getDate() - index * 3);
		return date.toISOString();
	}),
];

const previewPendingTransferredAt = [
	...Array.from({ length: 5 }, (_, index) => {
		const date = new Date(baseDate);
		date.setDate(date.getDate() - index);
		return date.toISOString();
	}),
	...Array.from({ length: 7 }, (_, index) => {
		const date = new Date(baseDate);
		date.setDate(date.getDate() - index * 4);
		return date.toISOString();
	}),
];

const previewStats: OverviewStats = {
	totalPatients: previewPatientCreatedAt.length,
	transferredRecords: previewPatientTransferredAt.length,
	pendingTransfers: previewPendingTransferredAt.length,
	patientCreatedAt: previewPatientCreatedAt,
	patientTransferredAt: previewPatientTransferredAt,
	pendingTransferredAt: previewPendingTransferredAt,
	hasPatients: previewPatientCreatedAt.length > 0,
};

const stats = previewStats;

export default function Overview() {
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
