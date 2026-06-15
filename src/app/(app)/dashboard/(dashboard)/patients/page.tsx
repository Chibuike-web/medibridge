import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getPatients } from "@/lib/api/get-patients";
import Image from "next/image";
import { PatientsClient } from "./patients-client";

export const metadata = {
	title: "Patients",
};

export default async function PatientsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { page, limit, query } = await searchParams;
	const currentPage = typeof page === "string" ? parseInt(page, 10) : 1;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : 14;
	const currentQuery = typeof query === "string" ? query : "";
	const { hasPatients, patients, totalPatients } = await getPatients(
		currentPage,
		currentLimit,
		currentQuery,
	);
	const totalPages = Math.ceil(totalPatients / currentLimit) || 1;

	return hasPatients ? (
		<PatientsClient
			patients={patients}
			page={currentPage}
			limit={currentLimit}
			totalPages={totalPages}
			searchQuery={currentQuery}
		/>
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
