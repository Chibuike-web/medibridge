"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "@/icons/plus";
import Link from "next/link";

export function PatientsRecordsClient() {
	return (
		<div className="w-full mx-auto max-w-7xl flex items-center justify-center h-full p-10">
			<div className="flex flex-col items-center max-w-xl">
				<h1 className="font-semibold text-2xl text-center text-balance mb-6">No Records Yet</h1>
				<p className="mb-12 text-center text-pretty">
					Patient records will appear here once you add them. Start by creating a patient profile.
				</p>
				<Button className="h-11" asChild>
					<Link href="/dashboard/add-new-patient">
						<Plus className="size-6" /> Add New Patient
					</Link>
				</Button>
			</div>
		</div>
	);
}
