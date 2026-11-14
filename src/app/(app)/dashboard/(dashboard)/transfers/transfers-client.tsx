"use client";

import { AnimatedFilterChips } from "@/components/animated-filter-chips";
import { FilterChip, formatChecklistFilterLabel } from "@/components/filter-chip";
import { ExportButton } from "@/components/export-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterButtons } from "@/features/transfers/components/filter-buttons";
import { TransferTable } from "@/features/transfers/components/transfer-table";
import type { TransferStatusFilter, TransferType } from "@/features/transfers/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { format } from "date-fns";
import { RiSearchLine } from "@remixicon/react";
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
	const [optimisticPage, setOptimisticPage] = useOptimistic(page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(limit);
	const [isPending, startTransition] = useTransition();
	const [optimisticRequestedAtRange, setOptimisticRequestedAtRange] = useOptimistic({
		requestedFrom,
		requestedTo,
	});
	const [optimisticStatusFilters, setOptimisticStatusFilters] = useOptimistic(statusFilters);
	const [previousSearchQuery, setPreviousSearchQuery] = useState(searchQuery);
	const [navigatedQuery, setNavigatedQuery] = useState<string | null>(null);
	const [optimisticQuery, setOptimisticQuery] = useOptimistic(searchQuery);
	if (previousSearchQuery !== searchQuery) {
		setPreviousSearchQuery(searchQuery);
		setNavigatedQuery(null);
		if (searchQuery !== navigatedQuery) setTransferSearchQuery(searchQuery);
	}

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		if (nextQuery !== transferSearchQuery || nextQuery === optimisticQuery) return;

		startTransition(() => {
			setNavigatedQuery(nextQuery);
			setOptimisticQuery(nextQuery);
			setOptimisticPage(1);

			router.replace(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(optimisticLimit),
						query: nextQuery,
					})) as Route,
				{ scroll: false },
			);
		});
	}, 300);

	function createQueryString(params: Record<string, string>) {
		const newParams = new URLSearchParams(searchParams.toString());
		Object.entries({
			page: String(optimisticPage),
			limit: String(optimisticLimit),
			query: transferSearchQuery,
			requestedFrom: optimisticRequestedAtRange.requestedFrom,
			requestedTo: optimisticRequestedAtRange.requestedTo,
			status: optimisticStatusFilters.join(","),
			...params,
		}).forEach(([name, value]) => {
			if (
				value.trim() === "" ||
				(name === "page" && value === "1") ||
				(name === "limit" && value === "14")
			) {
				newParams.delete(name);
			} else {
				newParams.set(name, value);
			}
		});
		return newParams.toString();
	}

	function handleQueryChange(nextQuery: string) {
		setTransferSearchQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handleRequestedAtRangeApply(nextRequestedFrom: string, nextRequestedTo: string) {
		startTransition(() => {
			setNavigatedQuery(transferSearchQuery);
			setOptimisticQuery(transferSearchQuery);
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
						limit: String(optimisticLimit),
						requestedFrom: nextRequestedFrom,
						requestedTo: nextRequestedTo,
					})) as Route,
				{ scroll: false },
			);
		});
	}

	function handleStatusFiltersChange(nextStatusFilters: TransferStatusFilter[]) {
		startTransition(() => {
			setNavigatedQuery(transferSearchQuery);
			setOptimisticQuery(transferSearchQuery);
			setOptimisticPage(1);
			setOptimisticStatusFilters(nextStatusFilters);

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(optimisticLimit),
						status: nextStatusFilters.join(","),
					})) as Route,
				{ scroll: false },
			);
		});
	}

	function handleFiltersClear() {
		startTransition(() => {
			setNavigatedQuery(transferSearchQuery);
			setOptimisticQuery(transferSearchQuery);
			setOptimisticPage(1);
			setOptimisticRequestedAtRange({
				requestedFrom: "",
				requestedTo: "",
			});
			setOptimisticStatusFilters([]);

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(optimisticLimit),
						requestedFrom: "",
						requestedTo: "",
						status: "",
					})) as Route,
				{ scroll: false },
			);
		});
	}

	function handlePreviousPage() {
		const previousPage = Math.max(1, optimisticPage - 1);

		startTransition(() => {
			setNavigatedQuery(transferSearchQuery);
			setOptimisticQuery(transferSearchQuery);
			setOptimisticPage(previousPage);

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: String(previousPage),
						limit: String(optimisticLimit),
					})) as Route,
				{ scroll: false },
			);
		});
	}

	function handleNextPage() {
		const nextPage = Math.min(totalPages, optimisticPage + 1);

		startTransition(() => {
			setNavigatedQuery(transferSearchQuery);
			setOptimisticQuery(transferSearchQuery);
			setOptimisticPage(nextPage);

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: String(nextPage),
						limit: String(optimisticLimit),
					})) as Route,
				{ scroll: false },
			);
		});
	}

	function handleLimitChange(value: string) {
		const nextLimit = Number(value);

		startTransition(() => {
			setNavigatedQuery(transferSearchQuery);
			setOptimisticQuery(transferSearchQuery);
			setOptimisticPage(1);
			setOptimisticLimit(nextLimit);

			router.push(
				(pathname +
					"?" +
					createQueryString({ page: String(1), limit: String(nextLimit) })) as Route,
				{ scroll: false },
			);
		});
	}

	const returnTo = getCurrentRoute(pathname, searchParams);
	const newTransferRequestHref =
		`/dashboard/new-transfer-request?returnTo=${encodeURIComponent(returnTo)}` as Route;

	return (
		<div className="h-full overflow-y-auto">
			<section className="mx-auto flex w-full max-w-7xl flex-col px-6 pt-4 pb-6 lg:px-10">
				<header className="mb-4 flex flex-col gap-4 text-sm">
					<h1 className="text-lg font-semibold text-balance text-gray-800 tracking-[-0.015em]">
						Transfers
					</h1>
					<div className="flex flex-wrap items-center gap-2">
						<div className="relative min-w-0 grow-[999] basis-80">
							<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
							<Input
								type="search"
								className="pl-8"
								placeholder="Search by patient name or ID"
								value={transferSearchQuery}
								onChange={(event) => handleQueryChange(event.target.value)}
							/>
						</div>
						<div className="flex grow flex-wrap items-center gap-2 max-md:w-full">
							<FilterButtons
								requestedFrom={optimisticRequestedAtRange.requestedFrom}
								requestedTo={optimisticRequestedAtRange.requestedTo}
								onRequestedAtRangeApply={handleRequestedAtRangeApply}
								onStatusFiltersChange={handleStatusFiltersChange}
								statusFilters={optimisticStatusFilters}
							/>
							<ExportButton />

							<Button className="flex-1" asChild>
								<Link href={newTransferRequestHref} prefetch={true}>
									New transfer request{" "}
								</Link>
							</Button>
						</div>
					</div>
				</header>
				<TransferActiveFilterChips
					requestedFrom={optimisticRequestedAtRange.requestedFrom}
					requestedTo={optimisticRequestedAtRange.requestedTo}
					statusFilters={optimisticStatusFilters}
					onRequestedAtRangeApply={handleRequestedAtRangeApply}
					onStatusFiltersChange={handleStatusFiltersChange}
					onFiltersClear={handleFiltersClear}
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
	);
}

function TransferActiveFilterChips({
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

	return (
		<AnimatedFilterChips isVisible={hasRequestedAtFilter || hasStatusFilters}>
			<div className="mb-4 flex flex-wrap gap-2">
				{hasStatusFilters ? (
					<FilterChip
						name="Status"
						value={formatChecklistFilterLabel(
							statusFilters.map((statusFilter) => transferStatusFilterLabels[statusFilter]),
						)}
						onRemove={() => onStatusFiltersChange([])}
					/>
				) : null}
				{hasRequestedAtFilter ? (
					<FilterChip
						name="Requested"
						value={formatDateRangeFilterLabel(requestedFrom, requestedTo)}
						onRemove={() => onRequestedAtRangeApply("", "")}
					/>
				) : null}
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
		</AnimatedFilterChips>
	);
}

function formatDateRangeFilterLabel(from: string, to: string) {
	const parsedFromDate = parseDateParam(from);
	const parsedToDate = parseDateParam(to);

	if (parsedFromDate && parsedToDate && from === to) {
		return format(parsedFromDate, "MMM d, yyyy");
	}

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
