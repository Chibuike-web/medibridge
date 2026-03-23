"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiAddLine, RiFilter3Line, RiSearch2Line, RiShareForwardBoxLine } from "@remixicon/react";

export function PatientsRecordsClient() {
	return (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-200 gap-20 bg-white px-8 h-16 flex items-center">
				<h1 className="text-xl font-semibold text-balance text-gray-950 tracking-[-0.015em]">
					Patient Records
				</h1>
				<div className="flex items-center gap-2 flex-1 justify-end">
					<div className="flex-1 max-w-[500px] min-w-[200px] relative">
						<RiSearch2Line className="size-5 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400 " />{" "}
						<Input
							type="text"
							className="h-10 w-full"
							placeholder="Search by department or physician"
						/>
					</div>

					<Button size="lg" variant="outline">
						<RiFilter3Line aria-hidden className="size-5 text-gray-600" />
						Filter
					</Button>
					<Button size="lg" variant="outline">
						<RiShareForwardBoxLine aria-hidden className="size-5 text-gray-600" />
						Export
					</Button>
					<Button size="lg">
						<RiAddLine aria-hidden className="size-5" />
						Add new patient
					</Button>
				</div>
			</header>
		</div>
	);
}
