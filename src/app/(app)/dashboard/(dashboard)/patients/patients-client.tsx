"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterButton } from "@/features/patients/components/filter-button";
import { PatientsTable } from "@/features/patients/components/patients-table";
import type { PatientListItemType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { RiSearchLine, RiShare2Line } from "@remixicon/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";

type PatientsClientProps = {
	patients: PatientListItemType[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery: string;
	createdFrom: string;
	createdTo: string;
};

export function PatientsClient({
	patients,
	page,
	limit,
	totalPages,
	searchQuery,
	createdFrom,
	createdTo,
}: PatientsClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [patientSearchQuery, setPatientSearchQuery] = useState(searchQuery);
	const [previousSearchQuery, setPreviousSearchQuery] = useState(searchQuery);
	const [optimisticPatientsPage, setOptimisticPatientsPage] = useOptimistic(page);
	const [optimisticPatientsLimit, setOptimisticPatientsLimit] = useOptimistic(limit);
	const [optimisticCreatedAtRange, setOptimisticCreatedAtRange] = useOptimistic({
		createdFrom,
		createdTo,
	});
	const [isUpdatingPatientsTable, startPatientsTableUpdateTransition] = useTransition();

	if (searchQuery !== previousSearchQuery) {
		setPreviousSearchQuery(searchQuery);
		setPatientSearchQuery(searchQuery);
	}

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		startPatientsTableUpdateTransition(async () => {
			setOptimisticPatientsPage(1);

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
			if (value.trim() === "") {
				newParams.delete(name);
			} else {
				newParams.set(name, value);
			}
		});

		return newParams.toString();
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		startPatientsTableUpdateTransition(async () => {
			setOptimisticPatientsPage(1);
			setOptimisticCreatedAtRange({
				createdFrom: nextCreatedFrom,
				createdTo: nextCreatedTo,
			});

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(limit),
						createdFrom: nextCreatedFrom,
						createdTo: nextCreatedTo,
					})) as Route,
			);
		});
	}

	function handleQueryChange(nextQuery: string) {
		setPatientSearchQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		startPatientsTableUpdateTransition(async () => {
			setOptimisticPatientsPage(page - 1);

			router.push(
				(pathname +
					"?" +
					createQueryString({ page: String(page - 1), limit: String(limit) })) as Route,
			);
		});
	}

	function handleNextPage() {
		startPatientsTableUpdateTransition(async () => {
			setOptimisticPatientsPage(page + 1);

			router.push(
				(pathname +
					"?" +
					createQueryString({ page: String(page + 1), limit: String(limit) })) as Route,
			);
		});
	}

	function handleLimitChange(value: string) {
		startPatientsTableUpdateTransition(async () => {
			setOptimisticPatientsPage(1);
			setOptimisticPatientsLimit(Number(value));

			router.push((pathname + "?" + createQueryString({ page: "1", limit: value })) as Route);
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
							value={patientSearchQuery}
							onChange={(event) => handleQueryChange(event.target.value)}
						/>
					</div>

					<FilterButton
						createdFrom={optimisticCreatedAtRange.createdFrom}
						createdTo={optimisticCreatedAtRange.createdTo}
						isPending={isUpdatingPatientsTable}
						onCreatedAtRangeApply={handleCreatedAtRangeApply}
					/>
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
						patients={patients}
						page={optimisticPatientsPage}
						limit={optimisticPatientsLimit}
						totalPages={totalPages}
						isPending={isUpdatingPatientsTable}
						onPreviousPage={handlePreviousPage}
						onNextPage={handleNextPage}
						onLimitChange={handleLimitChange}
					/>
				</section>
			</div>
		</div>
	);
}
