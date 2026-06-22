"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterButton } from "@/features/transfers/components/filter-button";
import { TransferTable } from "@/features/transfers/components/transfer-table";
import type {
	TransferStatusFilter,
	TransferType,
} from "@/features/transfers/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { format } from "date-fns";
import { RiCloseLine, RiSearchLine, RiShare2Line } from "@remixicon/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";

type TransfersClientProps = {
	transfers: TransferType[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery: string;
	requestedFrom: string;
	requestedTo: string;
	statusFilters: TransferStatusFilter[];
};

const transferStatusFilterLabels: Record<TransferStatusFilter, string> = {
	pending: "Pending",
	rejected: "Rejected",
	completed: "Completed",
	failed: "Failed",
	cancelled: "Cancelled",
};

export function TransfersClient({
	transfers,
	page,
	limit,
	totalPages,
	searchQuery,
	requestedFrom,
	requestedTo,
	statusFilters,
}: TransfersClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [transferSearchQuery, setTransferSearchQuery] = useState(searchQuery);
	const [previousSearchQuery, setPreviousSearchQuery] = useState(searchQuery);
	const [optimisticTransfersPage, setOptimisticTransfersPage] =
		useOptimistic(page);
	const [optimisticTransfersLimit, setOptimisticTransfersLimit] =
		useOptimistic(limit);
	const [isUpdatingTransfersTable, startTransfersTableUpdateTransition] =
		useTransition();
	const [optimistiRequestedAtRange, setOptimistiRequestedAtRange] =
		useOptimistic({
			requestedFrom,
			requestedTo,
		});
	const [optimisticTransferStatusFilters, setOptimisticTransferStatusFilters] =
		useOptimistic(statusFilters);

	if (searchQuery !== previousSearchQuery) {
		setPreviousSearchQuery(searchQuery);
		setTransferSearchQuery(searchQuery);
	}

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		startTransfersTableUpdateTransition(async () => {
			setOptimisticTransfersPage(1);

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(limit),
						query: nextQuery,
					})) as Route,
			);
		});
	}, 300);

	function createQueryString(params: Record<string, string>) {
		const newParams = new URLSearchParams(searchParams.toString());
		Object.entries(params).forEach(([name, value]) => {
			const trimmedValue = value.trim();

			if (trimmedValue === "") {
				newParams.delete(name);
				return;
			}

			newParams.set(name, trimmedValue);
		});
		return newParams.toString();
	}

	function handleQueryChange(nextQuery: string) {
		setTransferSearchQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handleRequestedAtRangeApply(
		nextRequestedFrom: string,
		nextRequestedTo: string,
	) {
		startTransfersTableUpdateTransition(async () => {
			setOptimisticTransfersPage(1);
			setOptimistiRequestedAtRange({
				requestedFrom: nextRequestedFrom,
				requestedTo: nextRequestedTo,
			});
			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(limit),
						requestedFrom: nextRequestedFrom,
						requestedTo: nextRequestedTo,
					})) as Route,
			);
		});
	}

	function handleStatusFiltersChange(
		nextStatusFilters: TransferStatusFilter[],
	) {
		startTransfersTableUpdateTransition(async () => {
			setOptimisticTransfersPage(1);
			setOptimisticTransferStatusFilters(nextStatusFilters);

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(limit),
						status: nextStatusFilters.join(","),
					})) as Route,
			);
		});
	}

	function handlePreviousPage() {
		startTransfersTableUpdateTransition(async () => {
			setOptimisticTransfersPage(page - 1);

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: String(page - 1),
						limit: String(limit),
					})) as Route,
			);
		});
	}

	function handleNextPage() {
		startTransfersTableUpdateTransition(async () => {
			setOptimisticTransfersPage(page + 1);

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: String(page + 1),
						limit: String(limit),
					})) as Route,
			);
		});
	}

	function handleLimitChange(value: string) {
		startTransfersTableUpdateTransition(async () => {
			setOptimisticTransfersPage(1);
			setOptimisticTransfersLimit(Number(value));

			router.push(
				(pathname +
					"?" +
					createQueryString({ page: "1", limit: value })) as Route,
			);
		});
	}

	const returnTo = getCurrentRoute(pathname, searchParams);
	const newTransferRequestHref =
		`/dashboard/new-transfer-request?returnTo=${encodeURIComponent(returnTo)}` as Route;

	return (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-200 bg-white px-8 h-16 flex items-center sticky top-0 z-20 shrink-0 text-sm">
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
							value={transferSearchQuery}
							onChange={(event) => handleQueryChange(event.target.value)}
						/>
					</div>

					<FilterButton
						requestedFrom={optimistiRequestedAtRange.requestedFrom}
						requestedTo={optimistiRequestedAtRange.requestedTo}
						isPending={isUpdatingTransfersTable}
						onRequestedAtRangeApply={handleRequestedAtRangeApply}
						onStatusFiltersChange={handleStatusFiltersChange}
						statusFilters={optimisticTransferStatusFilters}
					/>
					<Button
						size="lg"
						variant="outline"
						className="gap-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"
					>
						<RiShare2Line aria-hidden className="size-5 text-gray-600" />
						Export
					</Button>
					<Button size="lg" asChild>
						<Link href={newTransferRequestHref}>New transfer request </Link>
					</Button>
				</div>
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto">
				<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
					<TransferActiveFilterPills
						requestedFrom={optimistiRequestedAtRange.requestedFrom}
						requestedTo={optimistiRequestedAtRange.requestedTo}
						statusFilters={optimisticTransferStatusFilters}
						onRequestedAtRangeApply={handleRequestedAtRangeApply}
						onStatusFiltersChange={handleStatusFiltersChange}
					/>
					<TransferTable
						data={transfers}
						page={optimisticTransfersPage}
						limit={optimisticTransfersLimit}
						totalPages={totalPages}
						isPending={isUpdatingTransfersTable}
						onPreviousPage={handlePreviousPage}
						onNextPage={handleNextPage}
						onLimitChange={handleLimitChange}
					/>
				</section>
			</div>
		</div>
	);
}

function TransferActiveFilterPills({
	requestedFrom,
	requestedTo,
	statusFilters,
	onRequestedAtRangeApply,
	onStatusFiltersChange,
}: {
	requestedFrom: string;
	requestedTo: string;
	statusFilters: TransferStatusFilter[];
	onRequestedAtRangeApply: (requestedFrom: string, requestedTo: string) => void;
	onStatusFiltersChange: (statusFilters: TransferStatusFilter[]) => void;
}) {
	const hasRequestedAtFilter = Boolean(requestedFrom || requestedTo);
	const hasStatusFilters = statusFilters.length > 0;

	if (!hasRequestedAtFilter && !hasStatusFilters) {
		return null;
	}

	return (
		<div className="mb-4 flex flex-wrap gap-2">
			{statusFilters.map((statusFilter) => (
				<TransferFilterPill
					key={statusFilter}
					label={`Status: ${transferStatusFilterLabels[statusFilter]}`}
					onRemove={() => {
						onStatusFiltersChange(
							statusFilters.filter(
								(currentStatusFilter) => currentStatusFilter !== statusFilter,
							),
						);
					}}
				/>
			))}
			{hasRequestedAtFilter ? (
				<TransferFilterPill
					label={`Requested: ${formatDateRangeFilterLabel(requestedFrom, requestedTo)}`}
					onRemove={() => onRequestedAtRangeApply("", "")}
				/>
			) : null}
		</div>
	);
}

function TransferFilterPill({
	label,
	onRemove,
}: {
	label: string;
	onRemove: () => void;
}) {
	return (
		<span className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-100 py-1.5 pr-1.5 pl-3 text-sm font-medium text-gray-600 shadow-xs">
			<span>{label}</span>
			<button
				type="button"
				onClick={onRemove}
				className="flex size-5 items-center justify-center rounded-full bg-gray-800 text-white transition hover:bg-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
				aria-label={`Remove ${label} filter`}
			>
				<RiCloseLine className="size-4" aria-hidden={true} />
			</button>
		</span>
	);
}

function formatDateRangeFilterLabel(from: string, to: string) {
	const parsedFromDate = parseDateParam(from);
	const parsedToDate = parseDateParam(to);

	if (parsedFromDate && parsedToDate) {
		return `${format(parsedFromDate, "MMM d, yyyy")} - ${format(parsedToDate, "MMM d, yyyy")}`;
	}

	if (parsedFromDate) {
		return `From ${format(parsedFromDate, "MMM d, yyyy")}`;
	}

	if (parsedToDate) {
		return `Until ${format(parsedToDate, "MMM d, yyyy")}`;
	}

	return "Any date";
}

function getCurrentRoute(pathname: string, searchParams: URLSearchParams) {
	const queryString = searchParams.toString();

	return queryString ? `${pathname}?${queryString}` : pathname;
}
