import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { getTransfers } from "@/lib/api/get-transfers";
import { TransfersClient } from "./transfers-client";
import type { TransferStatusFilter } from "@/features/transfers/types";
import { getNumberParam, getStringParam, parseDateBoundaryParam } from "@/lib/utils/search-params";

export const metadata = {
	title: "Transfers",
};

const TRANSFER_STATUS_FILTERS = [
	"pending",
	"rejected",
	"completed",
	"failed",
	"cancelled",
] as const;

const transferStatusFilterSet = new Set<string>(TRANSFER_STATUS_FILTERS);

function parseTransferStatusFilters(status: string | string[] | undefined) {
	if (typeof status !== "string") return [];

	return status
		.split(",")
		.filter((value): value is TransferStatusFilter => transferStatusFilterSet.has(value));
}

type TransferPageProps = PageProps<"/dashboard/transfers">;
type TransferPageSearchParamsProps = Pick<TransferPageProps, "searchParams">;

export default function Transfers({ searchParams }: TransferPageProps) {
	return (
		<Suspense fallback={<TransfersPageSkeleton />}>
			<TransfersContent searchParams={searchParams} />
		</Suspense>
	);
}

async function TransfersContent({ searchParams }: TransferPageSearchParamsProps) {
	const { page, limit, query, requestedFrom, requestedTo, status } = await searchParams;
	const currentPage = getNumberParam(page, 1, { min: 1 });
	const currentLimit = getNumberParam(limit, 14, { min: 1, max: 100 });
	const currentQuery = getStringParam(query);
	const currentRequestedFrom = getStringParam(requestedFrom);
	const currentRequestedTo = getStringParam(requestedTo);
	const currentStatusFilters = parseTransferStatusFilters(status);
	const requestedAtFilter = {
		from: parseDateBoundaryParam(currentRequestedFrom, "start"),
		to: parseDateBoundaryParam(currentRequestedTo, "end"),
	};
	const { hasTransfers, transfers, totalTransfers } = await getTransfers(
		currentPage,
		currentLimit,
		currentQuery,
		requestedAtFilter,
		currentStatusFilters,
	);
	const totalPages = Math.max(1, Math.ceil(totalTransfers / currentLimit));

	return hasTransfers ? (
		<TransfersClient
			transfers={transfers}
			page={currentPage}
			limit={currentLimit}
			totalPages={totalPages}
			searchQuery={currentQuery}
			requestedFrom={currentRequestedFrom}
			requestedTo={currentRequestedTo}
			statusFilters={currentStatusFilters}
		/>
	) : (
		<div className="w-full mx-auto max-w-7xl flex items-center justify-center h-full p-10">
			<div className="flex w-[31.25rem] max-w-full flex-col items-center">
				<div className="aspect-[473/238] w-full overflow-hidden">
					<Image
						src="/assets/empty-state.svg"
						alt=""
						aria-hidden="true"
						width={473}
						height={357}
						className="h-auto w-full"
					/>
				</div>
				<div className="relative z-10 -mt-4 flex w-full flex-col items-center text-center">
					<h1 className="mb-2 text-center text-lg leading-6 font-semibold text-balance">
						No transfers yet
					</h1>
					<p className="mb-6 text-center text-sm">
						Start by creating your first transfer request to move patients securely.
					</p>
					<Button asChild>
						<Link href="/dashboard/new-transfer-request" prefetch={true}>
							Create transfer request
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

function TransfersPageSkeleton() {
	return (
		<div className="flex h-full flex-col">
			<header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-6">
				<div className="h-6 w-32 animate-pulse rounded bg-gray-100" />

				<div className="ml-auto flex flex-1 items-center justify-end gap-2">
					<div className="h-10 w-[20rem] animate-pulse rounded bg-gray-100" />
					<div className="h-10 w-10 animate-pulse rounded bg-gray-100" />
					<div className="h-10 w-24 animate-pulse rounded bg-gray-100" />
					<div className="h-10 w-44 animate-pulse rounded bg-gray-100" />
				</div>
			</header>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
					<TableLoadingSkeleton />
				</section>
			</div>
		</div>
	);
}

function TableLoadingSkeleton() {
	const gridColumns = "grid-cols-[2.5rem_1.4fr_8rem_1.5fr_8rem_8rem_3rem]";

	return (
		<div className="overflow-x-auto rounded-xl border border-gray-200 text-sm">
			<div className="min-w-[72rem] bg-white">
				<div className={`grid h-12 ${gridColumns} items-center gap-3 bg-gray-50 px-3`}>
					{Array.from({ length: 7 }).map((_, index) => (
						<div key={index} className="h-4 animate-pulse rounded bg-gray-200" />
					))}
				</div>
				<div>
					{Array.from({ length: 8 }).map((_, rowIndex) => (
						<div
							key={rowIndex}
							className={`grid min-h-14 ${gridColumns} items-center gap-3 border-b border-gray-200 px-3 last:border-b-0`}
						>
							{Array.from({ length: 7 }).map((_, cellIndex) => (
								<div key={cellIndex} className="h-4 animate-pulse rounded bg-gray-100" />
							))}
						</div>
					))}
				</div>
				<div className="flex min-h-14 items-center justify-between gap-3 border-t border-gray-200 bg-white p-3">
					<div className="flex items-center gap-3">
						<div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
						<div className="h-8 w-[4.25rem] animate-pulse rounded-md bg-gray-200" />
					</div>
					<div className="flex items-center gap-3">
						<div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
						<div className="h-8 w-20 animate-pulse rounded-md bg-gray-200" />
						<div className="h-8 w-14 animate-pulse rounded-md bg-gray-200" />
					</div>
				</div>
			</div>
		</div>
	);
}
