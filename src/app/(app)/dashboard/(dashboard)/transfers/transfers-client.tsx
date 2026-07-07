"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterButton } from "@/features/transfers/components/filter-button";
import { TransferTable } from "@/features/transfers/components/transfer-table";
import type { TransferStatusFilter, TransferType } from "@/features/transfers/types";
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
	const [optimisticPage, setOptimisticPage] = useOptimistic(page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(limit);
	const [isPending, startTransition] = useTransition();
	const [optimisticRequestedAtRange, setOptimisticRequestedAtRange] = useOptimistic({
		requestedFrom,
		requestedTo,
	});
	const [optimisticStatusFilters, setOptimisticStatusFilters] = useOptimistic(statusFilters);

	if (searchQuery !== previousSearchQuery) {
		setPreviousSearchQuery(searchQuery);
		setTransferSearchQuery(searchQuery);
	}

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		startTransition(async () => {
			setOptimisticPage(1);

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

	function handleRequestedAtRangeApply(nextRequestedFrom: string, nextRequestedTo: string) {
		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticRequestedAtRange({
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

	function handleStatusFiltersChange(nextStatusFilters: TransferStatusFilter[]) {
		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticStatusFilters(nextStatusFilters);

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
		startTransition(async () => {
			setOptimisticPage(page - 1);

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
		startTransition(async () => {
			setOptimisticPage(page + 1);

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
		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticLimit(Number(value));

			router.push((pathname + "?" + createQueryString({ page: "1", limit: value })) as Route);
		});
	}

	const returnTo = getCurrentRoute(pathname, searchParams);
	const newTransferRequestHref =
		`/dashboard/new-transfer-request?returnTo=${encodeURIComponent(returnTo)}` as Route;

	return (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-200 bg-white px-6 h-14 flex items-center sticky top-0 z-20 shrink-0 text-sm">
				<h1 className="text-xl font-semibold text-balance text-gray-800 tracking-[-0.015em]">
					Transfers
				</h1>
				<div className="flex items-center gap-2 flex-1 justify-end">
					<div className="relative min-w-[12.5rem] max-w-[31.25rem] flex-1">
						<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
						<Input
							type="search"
							className="pl-8"
							placeholder="Search by patient name or ID"
							value={transferSearchQuery}
							onChange={(event) => handleQueryChange(event.target.value)}
						/>
					</div>

					<FilterButton
						requestedFrom={optimisticRequestedAtRange.requestedFrom}
						requestedTo={optimisticRequestedAtRange.requestedTo}
						isPending={isPending}
						onRequestedAtRangeApply={handleRequestedAtRangeApply}
						onStatusFiltersChange={handleStatusFiltersChange}
						statusFilters={optimisticStatusFilters}
					/>
					<Button
						variant="outline"
						className="border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50"
					>
						<RiShare2Line aria-hidden className="size-5 text-gray-600" />
						Export
					</Button>

					<Button className="text-sm" asChild>
						<Link href={newTransferRequestHref}>New transfer request </Link>
					</Button>
				</div>
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto">
				<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
					<TransferActiveFilterPills
						requestedFrom={optimisticRequestedAtRange.requestedFrom}
						requestedTo={optimisticRequestedAtRange.requestedTo}
						statusFilters={optimisticStatusFilters}
						onRequestedAtRangeApply={handleRequestedAtRangeApply}
						onStatusFiltersChange={handleStatusFiltersChange}
					/>
					<TransferTable
						data={transfers}
						page={optimisticPage}
						limit={optimisticLimit}
						totalPages={totalPages}
						isPending={isPending}
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
							statusFilters.filter((currentStatusFilter) => currentStatusFilter !== statusFilter),
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

function TransferFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
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
