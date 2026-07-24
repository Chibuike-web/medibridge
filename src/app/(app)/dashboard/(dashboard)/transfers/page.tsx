import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { getTransfers } from "@/lib/api/get-transfers";
import { TransfersClient } from "./transfers-client";
import { TransfersPageSkeleton } from "./loading";
import type { TransferStatusFilter } from "@/features/transfers/types";
import { getNumberParam, getStringParam, parseDateBoundaryParam } from "@/lib/utils/search-params";

export const metadata = {
	title: "Transfers",
};

export const prefetch = "allow-runtime";
export const unstable_dynamicStaleTime = 300;

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
	return <TransfersContent searchParams={searchParams} />;
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
						<h1 className="mb-2 text-center text-xl font-semibold">No transfers yet</h1>
						<p className="mb-6 text-center text-sm">
							Start by creating your first transfer request to move patients securely.
						</p>
					<Button asChild className="text-sm">
						<Link href="/dashboard/new-transfer-request">Create transfer request</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
