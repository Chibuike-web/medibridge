import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PatientRecordsTable } from "@/features/patients/components/patient-records-table";
import { RiAddLine, RiSearchLine, RiShareForwardBoxLine } from "@remixicon/react";
import Link from "next/link";
import { patientRecords } from "@/features/patients/data";
import { FilterButton } from "../../../../../features/patients/components/filter-button";

export const metadata = {
	title: "Patient Records",
};

export default function PatientRecords() {
	return patientRecords.length > 0 ? (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-200 bg-white px-8 h-16 flex items-center sticky top-0 z-20 shrink-0">
				<h1 className="text-xl font-semibold text-balance text-gray-800 tracking-[-0.015em]">
					Patient Records
				</h1>
				<div className="flex items-center gap-2 flex-1 justify-end">
					<div className="relative min-w-[12.5rem] max-w-[31.25rem] flex-1">
						<RiSearchLine className="size-5 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
						<Input
							type="search"
							className="h-10 w-full pl-8"
							placeholder="Search by patient name or ID"
						/>
					</div>

					<FilterButton />
					<Button size="lg" variant="outline">
						<RiShareForwardBoxLine aria-hidden className="size-5 text-gray-600" />
						Export
					</Button>
					<Button size="lg" asChild>
						<Link href="/dashboard/add-new-patient">
							<RiAddLine aria-hidden className="size-5" />
							Add new patient
						</Link>
					</Button>
				</div>
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto">
				<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
					<PatientRecordsTable />
				</section>
			</div>
		</div>
	) : (
		<div className="w-full mx-auto max-w-7xl flex items-center justify-center h-full p-10">
			<div className="flex flex-col items-center max-w-[37.5rem]">
				<h1 className="font-semibold text-2xl text-center text-balance mb-6">No Records Yet</h1>
				<p className="mb-12 text-center text-pretty">
					Patient records will appear here once you add them. Start by creating a patient profile.
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
