"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterButton } from "@/features/transfers/components/filter-button";
import { TransferTable } from "@/features/transfers/components/transfer-table";
import type { TransferStatusFilter, TransferType } from "@/features/transfers/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { getNumberParam } from "@/lib/utils/search-params";
import { format } from "date-fns";
import { RiCloseLine, RiSearchLine, RiShare2Line } from "@remixicon/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import type { TransfersTableResult } from "@/app/api/transfers/route";

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
	page: initialPage,
	limit: initialLimit,
	totalPages,
	searchQuery: initialSearchQuery,
	requestedFrom: initialRequestedFrom,
	requestedTo: initialRequestedTo,
	statusFilters: initialStatusFilters,
}: TransfersClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const currentPage = getNumberParam(searchParams.get("page"), 1, { min: 1 });
	const currentLimit = getNumberParam(searchParams.get("limit"), 14, { min: 1, max: 100 });
	const currentQuery = searchParams.get("query") ?? "";
	const requestedFrom = searchParams.get("requestedFrom") ?? "";
	const requestedTo = searchParams.get("requestedTo") ?? "";
	const statusFilters = (searchParams.get("status") ?? "")
		.split(",")
		.filter((value): value is TransferStatusFilter =>
			["pending", "rejected", "completed", "failed", "cancelled"].includes(value),
		);
	const [transferSearch, setTransferSearch] = useState({
		query: currentQuery,
		urlQuery: currentQuery,
	});
	if (transferSearch.urlQuery !== currentQuery) {
		setTransferSearch({ query: currentQuery, urlQuery: currentQuery });
	}
	const requestParams = new URLSearchParams({
		page: String(currentPage),
		limit: String(currentLimit),
		query: currentQuery,
		requestedFrom: requestedFrom,
		requestedTo: requestedTo,
		status: statusFilters.join(","),
	});
	const initialParams = new URLSearchParams({
		page: String(initialPage),
		limit: String(initialLimit),
		query: initialSearchQuery,
		requestedFrom: initialRequestedFrom,
		requestedTo: initialRequestedTo,
		status: initialStatusFilters.join(","),
	});
	const key = `/api/transfers?${requestParams}`;
	const initialKey = `/api/transfers?${initialParams}`;
	const {
		data: tableResult,
		error: tableError,
		isLoading,
		isValidating,
	} = useSWR(
		key,
		async (url: string) => {
			const response = await fetch(url);
			const result = (await response.json()) as TransfersTableResult;
			if (!response.ok || result.status === "failed") {
				throw Object.assign(
					new Error(result.status === "failed" ? result.error : "Unable to load transfers."),
					{ status: response.status },
				);
			}
			return result;
		},
		{
			keepPreviousData: true,
			fallbackData:
				key === initialKey
					? { status: "success", transfers, page: initialPage, limit: initialLimit, totalPages }
					: undefined,
			onError: (error: Error & { status?: number }) => {
				if (error.status === 401 || error.status === 403) router.refresh();
			},
			shouldRetryOnError: (error: Error & { status?: number }) =>
				error.status !== 401 && error.status !== 403,
		},
	);
	const isPending = isLoading || isValidating;
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		if (nextQuery !== transferSearch.query) return;
		window.history.replaceState(
			null,
			"",
			pathname + "?" + createQueryString({ page: "1", query: nextQuery }),
		);
	}, 300);

	function createQueryString(params: Record<string, string>) {
		const newParams = new URLSearchParams(window.location.search);
		Object.entries(params).forEach(([name, value]) => {
			if (value.trim() === "") newParams.delete(name);
			else newParams.set(name, value);
		});
		return newParams.toString();
	}

	function handleQueryChange(nextQuery: string) {
		setTransferSearch({ query: nextQuery, urlQuery: currentQuery });
		debouncedSearch(nextQuery);
	}
	function handleRequestedAtRangeApply(nextRequestedFrom: string, nextRequestedTo: string) {
		window.history.replaceState(
			null,
			"",
			pathname +
				"?" +
				createQueryString({
					page: "1",
					requestedFrom: nextRequestedFrom,
					requestedTo: nextRequestedTo,
				}),
		);
	}
	function handleStatusFiltersChange(nextStatusFilters: TransferStatusFilter[]) {
		window.history.replaceState(
			null,
			"",
			pathname + "?" + createQueryString({ page: "1", status: nextStatusFilters.join(",") }),
		);
	}
	function handleFiltersClear() {
		window.history.replaceState(
			null,
			"",
			pathname +
				"?" +
				createQueryString({ page: "1", requestedFrom: "", requestedTo: "", status: "" }),
		);
	}
	function handlePreviousPage() {
		window.history.pushState(
			null,
			"",
			pathname + "?" + createQueryString({ page: String(Math.max(currentPage - 1, 1)) }),
		);
	}
	function handleNextPage() {
		window.history.pushState(
			null,
			"",
			pathname +
				"?" +
				createQueryString({
					page: String(Math.min(currentPage + 1, tableResult?.totalPages ?? 1)),
				}),
		);
	}
	function handleLimitChange(value: string) {
		window.history.replaceState(
			null,
			"",
			pathname + "?" + createQueryString({ page: "1", limit: value }),
		);
	}
	const returnTo = getCurrentRoute(pathname, searchParams);
	const newTransferRequestHref =
		`/dashboard/new-transfer-request?returnTo=${encodeURIComponent(returnTo)}` as Route;

	return (
		<div className="h-full overflow-y-auto">
			<section className="mx-auto flex w-full max-w-7xl flex-col px-6 py-6 lg:px-10">
				<header className="mb-4 flex flex-col gap-4 text-sm">
					<h1 className="text-lg font-semibold text-balance text-gray-800 tracking-[-0.015em]">
						Transfers
					</h1>
					<div className="flex items-center gap-2">
						<div className="relative flex-1">
							<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
							<Input
								type="search"
								className="pl-8"
								placeholder="Search by patient name or ID"
								value={transferSearch.query}
								onChange={(event) => handleQueryChange(event.target.value)}
							/>
						</div>

						<FilterButton
							requestedFrom={requestedFrom}
							requestedTo={requestedTo}
							isPending={isPending}
							onRequestedAtRangeApply={handleRequestedAtRangeApply}
							onStatusFiltersChange={handleStatusFiltersChange}
							statusFilters={statusFilters}
						/>
						<Button variant="outline" className="bg-white text-gray-600 hover:bg-gray-50">
							<RiShare2Line aria-hidden className="size-5 text-gray-600" />
							Export
						</Button>

						<Button asChild>
							<Link href={newTransferRequestHref} prefetch={true}>
								New transfer request{" "}
							</Link>
						</Button>
					</div>
				</header>
				<TransferActiveFilterPills
					requestedFrom={requestedFrom}
					requestedTo={requestedTo}
					statusFilters={statusFilters}
					onRequestedAtRangeApply={handleRequestedAtRangeApply}
					onStatusFiltersChange={handleStatusFiltersChange}
					onFiltersClear={handleFiltersClear}
				/>
				{tableError ? <p role="alert">{tableError.message}</p> : null}
				<TransferTable
					data={tableResult?.transfers ?? []}
					page={currentPage}
					limit={currentLimit}
					totalPages={tableResult?.totalPages ?? 1}
					isPending={isPending}
					onPreviousPage={handlePreviousPage}
					onNextPage={handleNextPage}
					onLimitChange={handleLimitChange}
				/>
			</section>
		</div>
	);
}

function TransferActiveFilterPills({
	requestedFrom,
	requestedTo,
	statusFilters,
	onRequestedAtRangeApply,
	onStatusFiltersChange,
	onFiltersClear,
}: {
	requestedFrom: string;
	requestedTo: string;
	statusFilters: TransferStatusFilter[];
	onRequestedAtRangeApply: (requestedFrom: string, requestedTo: string) => void;
	onStatusFiltersChange: (statusFilters: TransferStatusFilter[]) => void;
	onFiltersClear: () => void;
}) {
	const hasRequestedAtFilter = Boolean(requestedFrom || requestedTo);
	const hasStatusFilters = statusFilters.length > 0;

	if (!hasRequestedAtFilter && !hasStatusFilters) {
		return null;
	}

	return (
		<div className="mb-4 flex items-start gap-4">
			<div className="flex flex-1 flex-wrap gap-2">
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
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="h-8.5 text-gray-600"
				onClick={onFiltersClear}
			>
				Clear all
			</Button>
		</div>
	);
}

function TransferFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
	return (
		<span className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-100 py-1.5 pr-1.5 pl-3 text-sm font-medium text-gray-600 shadow-xs">
			<span>{label}</span>
			<Button
				size="icon"
				type="button"
				onClick={onRemove}
				className="flex size-5 rounded-full text-white hover:bg-gray-500 focus-visible:ring-2 focus-visible:ring-gray-300"
				aria-label={`Remove ${label} filter`}
			>
				<RiCloseLine className="size-4" aria-hidden={true} />
			</Button>
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
