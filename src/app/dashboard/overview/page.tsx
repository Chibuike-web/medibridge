import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "@/icons/plus";
import Link from "next/link";
import { getOverviewStatsService } from "@/services/patient/get-overview-stats-service";
import { OverviewStats } from "@/services/patient/types";
import { OverviewClient } from "./overview-client";

const previewPatientCreatedAt = [
	...Array.from({ length: 6 }, (_, index) => {
		const date = new Date("2026-03-18T10:00:00.000Z");
		date.setDate(date.getDate() - index - 1);
		return date.toISOString();
	}),
	...Array.from({ length: 122 }, (_, index) => {
		const date = new Date("2026-03-11T10:00:00.000Z");
		date.setDate(date.getDate() - index * 2);
		return date.toISOString();
	}),
];

const previewStats: OverviewStats = {
	totalPatients: 128,
	transferredRecords: 18,
	newPatients: 6,
	patientCreatedAt: previewPatientCreatedAt,
	hasPatients: true,
};

export default async function Overview({
	searchParams,
}: {
	searchParams?: Promise<{ preview?: string }>;
}) {
	const params = await searchParams;
	const previewMode = params?.preview === "true";
	const stats = previewMode ? previewStats : await getOverviewStatsService();

	return (
		<DashboardLayout>
			{stats.hasPatients ? (
				<OverviewClient stats={stats} />
			) : (
				<div className="mx-auto flex h-full w-full max-w-7xl items-center justify-center p-10">
					<div className="flex max-w-xl flex-col items-center">
						<h1 className="mb-6 text-center text-2xl font-semibold text-balance text-gray-950">
							No Patients Yet
						</h1>
						<p className="mb-12 text-center text-pretty text-gray-600">
							You have not added any patients to your list yet. Start by creating a new patient
							profile.
						</p>
						<Button className="h-11" asChild>
							<Link href="/dashboard/add-new-patient">
								<Plus className="size-6" /> Add New Patient
							</Link>
						</Button>
					</div>
				</div>
			)}
		</DashboardLayout>
	);
}
