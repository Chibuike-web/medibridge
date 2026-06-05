import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PatientsTable } from "@/features/patients/components/patients-table";
import { RiAddLine, RiSearchLine, RiShare2Line } from "@remixicon/react";
import Link from "next/link";
import { FilterButton } from "@/features/patients/components/filter-button";
import { getPatients } from "@/lib/api/get-patients";
import Image from "next/image";

export const metadata = {
	title: "Patients",
};

export default async function PatientsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { page, limit } = await searchParams;
	const currentPage = typeof page === "string" ? parseInt(page, 10) : 1;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : 14;
	const { hasPatients, patients, totalPatients } = await getPatients(currentPage, currentLimit);
	const totalPages = Math.ceil(totalPatients / currentLimit) || 1;

	return hasPatients ? (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-200 bg-white px-8 h-16 flex items-center sticky top-0 z-20 shrink-0">
				<h1 className="text-xl font-semibold text-balance text-gray-800 tracking-[-0.015em]">
					Patients
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
						<RiShare2Line aria-hidden className="size-5 text-gray-600" />
						Export
					</Button>
					<Button size="lg" asChild>
						<Link href="/dashboard/add-new-patient">Add patient</Link>
					</Button>
				</div>
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto">
				<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
					<PatientsTable
						patients={patients}
						page={currentPage}
						limit={currentLimit}
						totalPages={totalPages}
					/>
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
						Patient records will appear here once patients have been added to the system.
					</p>
					<Button className="h-11" asChild>
						<Link href="/dashboard/add-new-patient">Add patient </Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
