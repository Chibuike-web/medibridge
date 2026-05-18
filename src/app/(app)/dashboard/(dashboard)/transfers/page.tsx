import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TransferTable } from "@/features/transfers/components/transfer-table";
import { RiAddLine, RiSearchLine, RiShareForwardBoxLine } from "@remixicon/react";
import Link from "next/link";
import { transferRecords } from "@/features/transfers/data";
import { FilterButton } from "@/features/transfers/components/filter-button";

export const metadata = {
	title: "Transfers",
};

export default async function Transfers({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { page, limit } = await searchParams;
	const currentPage = typeof page === "string" ? parseInt(page, 10) : 1;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : 10;
	return transferRecords.length > 0 ? (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-200 bg-white px-8 h-16 flex items-center sticky top-0 z-20 shrink-0">
				<h1 className="text-xl font-semibold text-balance text-gray-800 tracking-[-0.015em]">
					Transfers
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
						<Link href="/dashboard/new-transfer-request">
							<RiAddLine aria-hidden className="size-5" />
							Add new transfer
						</Link>
					</Button>
				</div>
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto">
				<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
					<TransferTable />
				</section>
			</div>
		</div>
	) : (
		<div className="h-full">
			<div className="w-full mx-auto max-w-7xl flex items-center justify-center h-full p-10">
				<div className="flex flex-col items-center max-w-[37.5rem]">
					<h1 className="font-semibold text-2xl text-center mb-6">No transfers yet</h1>
					<p className="mb-12 text-center">
						Start by creating your first transfer request to move patients securely.
					</p>
					<Button className="h-11" asChild>
						<Link href="/dashboard/new-transfer-request">Create transfer request </Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
