"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterButton } from "@/features/patients/components/filter-button";
import { PatientsTable } from "@/features/patients/components/patients-table";
import { getPatientsTableAction } from "@/features/patients/server/actions";
import type { PatientListItemType } from "@/features/patients/types";
import { useDebounced } from "@/hooks/use-debounced";
import { RiSearchLine, RiShare2Line } from "@remixicon/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";

type PatientsClientProps = {
	patients: PatientListItemType[];
	page: number;
	limit: number;
	totalPages: number;
};

export function PatientsClient({
	patients,
	page,
	limit,
	totalPages,
}: PatientsClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [tableData, setTableData] = useState(patients);
	const [currentPage, setCurrentPage] = useState(page);
	const [currentLimit, setCurrentLimit] = useState(limit);
	const [currentTotalPages, setCurrentTotalPages] = useState(totalPages);
	const [optimisticPage, setOptimisticPage] = useOptimistic(currentPage);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(currentLimit);
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebounced(query, 300);
	const [isPending, startTransition] = useTransition();
	const hasMountedRef = useRef(false);

	function createQueryString(params: Record<string, string>) {
		const newParams = new URLSearchParams(searchParams.toString());
		Object.entries(params).forEach(([name, value]) => {
			newParams.set(name, value);
		});
		return newParams.toString();
	}

	useEffect(() => {
		if (!hasMountedRef.current) {
			hasMountedRef.current = true;
			return;
		}

		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientsTableAction({
				page: 1,
				limit: currentLimit,
				query: debouncedQuery,
			});

			setTableData(result.patients);
			setCurrentPage(result.page);
			setCurrentLimit(result.limit);
			setCurrentTotalPages(result.totalPages);
		});
	}, [debouncedQuery]);

	function handlePreviousPage() {
		startTransition(async () => {
			setOptimisticPage(currentPage - 1);

			const result = await getPatientsTableAction({
				page: currentPage - 1,
				limit: currentLimit,
				query: debouncedQuery,
			});

			setTableData(result.patients);
			setCurrentPage(result.page);
			setCurrentLimit(result.limit);
			setCurrentTotalPages(result.totalPages);
			router.push(
				(pathname +
					"?" +
					createQueryString({ page: String(result.page), limit: String(result.limit) })) as Route,
				{ scroll: false },
			);
		});
	}

	function handleNextPage() {
		startTransition(async () => {
			setOptimisticPage(currentPage + 1);

			const result = await getPatientsTableAction({
				page: currentPage + 1,
				limit: currentLimit,
				query: debouncedQuery,
			});

			setTableData(result.patients);
			setCurrentPage(result.page);
			setCurrentLimit(result.limit);
			setCurrentTotalPages(result.totalPages);
			router.push(
				(pathname +
					"?" +
					createQueryString({ page: String(result.page), limit: String(result.limit) })) as Route,
				{ scroll: false },
			);
		});
	}

	function handleLimitChange(value: string) {
		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticLimit(Number(value));

			const result = await getPatientsTableAction({
				page: 1,
				limit: value,
				query: debouncedQuery,
			});

			setTableData(result.patients);
			setCurrentPage(result.page);
			setCurrentLimit(result.limit);
			setCurrentTotalPages(result.totalPages);
			router.push(
				(pathname +
					"?" +
					createQueryString({ page: String(result.page), limit: String(result.limit) })) as Route,
				{ scroll: false },
			);
		});
	}

	return (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-200 bg-white px-8 h-16 flex items-center sticky top-0 z-20 shrink-0">
				<h1 className="text-xl font-semibold text-balance text-gray-800 tracking-[-0.015em]">
					Patients
				</h1>
				<div className="flex items-center gap-2 flex-1 justify-end">
					<div className="relative min-w-[12.5rem] max-w-[31.25rem] flex-1">
						<RiSearchLine className="size-5 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
						<Input
							type="search"
							className="h-10 w-full pl-8"
							placeholder="Search by patient name or ID"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
						/>
					</div>

					<FilterButton />
					<Button size="lg" variant="outline">
						<RiShare2Line aria-hidden className="size-5 text-gray-600" />
						Export
					</Button>
					<Button size="lg" asChild>
						<Link href="/dashboard/add-new-patient">Add patient</Link>
					</Button>
				</div>
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto">
				<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
					<PatientsTable
						patients={tableData}
						page={optimisticPage}
						limit={optimisticLimit}
						totalPages={currentTotalPages}
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
