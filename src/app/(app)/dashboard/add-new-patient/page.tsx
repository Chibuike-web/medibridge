import { AddNewPatientClient } from "@/app/(app)/dashboard/add-new-patient/add-new-patient-client";
import Link from "next/link";
import { RiArrowLeftLine } from "@remixicon/react";
import { verifySession } from "@/lib/api/verify-session";
import { Suspense } from "react";

export const metadata = {
	title: "Add New Patient",
};

export default async function AddNewPatient() {
	return (
		<Suspense>
			<AddNewPatientContent />
		</Suspense>
	);
}

async function AddNewPatientContent() {
	await verifySession();

	return (
		<>
			<nav className="w-full h-16 flex items-center sticky z-1 top-0 bg-white border-b border-gray-300 px-8">
				<Link href="/dashboard/overview" className="flex gap-2 w-max items-center text-foreground">
					<RiArrowLeftLine className="size-5" /> <span className="sr-only">Back</span>
				</Link>
			</nav>

			<main className="flex flex-col gap-9 mt-12 max-w-[37.5rem] mx-auto px-6 md:px-0">
				<div>
					<h1 className="font-semibold text-2xl text-center mb-6">Upload Patient’s Record</h1>
					<p className="text-gray-600 text-center text-balance">
						Upload a document with the patient’s basic details to create their profile. Only
						essential personal information is needed at this stage. Upload one document per patient.
					</p>
				</div>
				<AddNewPatientClient />
			</main>
		</>
	);
}
