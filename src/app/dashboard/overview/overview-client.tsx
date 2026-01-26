"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "@/icons/plus";

import Link from "next/link";

export function OverviewClient() {
	return (
		<div className="w-full mx-auto max-w-[1440px] flex items-center justify-center h-full p-10">
			<div className="flex flex-col items-center max-w-[600x]">
				<h1 className="font-semibold text-[24px] text-center mb-6">No patients yet</h1>
				<p className="mb-12 text-center">
					You haven’t added any patients to your list. Start by creating a new patient profile.
				</p>

				<Button className="h-11" asChild>
					<Link href="/dashboard/add-new-patient">
						<Plus className="size-6" /> Add new patient
					</Link>
				</Button>
			</div>
		</div>
	);
}
