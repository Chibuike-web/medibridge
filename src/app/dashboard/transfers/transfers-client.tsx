"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TransferPreviewTable } from "@/features/transfers/components/transfer-preview-table";
import { RiAddLine, RiFilter3Line, RiSearch2Line, RiShareForwardBoxLine } from "@remixicon/react";

export function TransfersClient() {
	return (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-200 bg-white px-8 h-16 flex items-center sticky top-0 z-20 shrink-0">
				<h1 className="text-xl font-semibold text-balance text-gray-950 tracking-[-0.015em]">
					Transfers
				</h1>
				<div className="flex items-center gap-2 flex-1 justify-end">
					<div className="flex-1 max-w-[500px] min-w-[200px] relative">
						<RiSearch2Line className="size-5 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400 " />
						<Input
							type="search"
							className="h-10 w-full pl-8"
							placeholder="Search by patient name or ID"
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
					<Button size="lg" asChild>
						<Link href="/dashboard/new-transfer-request">
							<RiAddLine aria-hidden className="size-5" />
							Add new transfer
						</Link>
					</Button>
				</div>
			</header>

			<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
				<TransferPreviewTable />
			</section>
		</div>
	);
}
