import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PatientsRecordsClient } from "./patients-records-client";
import { RiAddLine } from "@remixicon/react";

export default async function PatientRecords({
	searchParams,
}: {
	searchParams?: Promise<{ preview?: string }>;
}) {
	const params = await searchParams;
	const previewMode = params?.preview === "true";

	return (
		<DashboardLayout>
			{previewMode ? (
				<PatientsRecordsClient />
			) : (
				<div className="w-full mx-auto max-w-7xl flex items-center justify-center h-full p-10">
					<div className="flex flex-col items-center max-w-[37.5rem]">
						<h1 className="font-semibold text-2xl text-center text-balance mb-6">No Records Yet</h1>
						<p className="mb-12 text-center text-pretty">
							Patient records will appear here once you add them. Start by creating a patient
							profile.
						</p>
						<Button className="h-11" asChild>
							<Link href="/dashboard/add-new-patient">
								<RiAddLine className="size-6" /> Add New Patient
							</Link>
						</Button>
					</div>
				</div>
			)}
		</DashboardLayout>
	);
}
