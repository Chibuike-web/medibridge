"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterButton } from "@/features/patients/components/filter-button";
import { PatientsTable } from "@/features/patients/components/patients-table";
import { getPatientsTableAction } from "@/features/patients/server/actions";
import type {
	PatientAgeGroupFilter,
	PatientGenderFilter,
	PatientListItemType,
} from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { parseDateBoundaryParam } from "@/lib/utils/search-params";
import { format } from "date-fns";
import { RiCloseLine, RiSearchLine, RiShare2Line } from "@remixicon/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useRef, useState, useTransition } from "react";

type PatientsClientProps = {
	patients: PatientListItemType[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery: string;
	createdFrom: string;
	createdTo: string;
	genderFilter: PatientGenderFilter;
	ageGroupFilter: PatientAgeGroupFilter;
};

const patientAgeGroupFilterLabels: Record<Exclude<PatientAgeGroupFilter, "">, string> = {
	children: "0-12 (Children)",
	teenagers: "13-17 (Teenagers)",
	"young-adults": "18-35 (Young adults)",
	adults: "36-59 (Adults)",
	seniors: "60+ (Seniors)",
};

const patientGenderFilterLabels: Record<Exclude<PatientGenderFilter, "">, string> = {
	male: "Male",
	female: "Female",
};

export function PatientsClient({
	ageGroupFilter,
	patients,
	page,
	limit,
	totalPages,
	searchQuery,
	createdFrom,
	createdTo,
	genderFilter,
}: PatientsClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [patientSearchQuery, setPatientSearchQuery] = useState(searchQuery);
	const [tableData, setTableData] = useState({
		patients,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [optimisticCreatedAtRange, setOptimisticCreatedAtRange] = useOptimistic({
		createdFrom,
		createdTo,
	});
	const [optimisticAgeGroupFilter, setOptimisticAgeGroupFilter] = useOptimistic(ageGroupFilter);
	const [optimisticGenderFilter, setOptimisticGenderFilter] = useOptimistic(genderFilter);
	const [isPending, startTransition] = useTransition();
	const latestPatientsTableRequestIdRef = useRef(0);

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		latestPatientsTableRequestIdRef.current += 1;
		const patientsTableRequestId = latestPatientsTableRequestIdRef.current;

		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientsTableAction({
				page: 1,
				limit: tableData.limit,
				query: nextQuery,
				createdAtFilter: {
					from: parseDateBoundaryParam(optimisticCreatedAtRange.createdFrom, "start"),
					to: parseDateBoundaryParam(optimisticCreatedAtRange.createdTo, "end"),
				},
				patientFilterOptions: {
					gender: optimisticGenderFilter || undefined,
					ageRange: getPatientAgeRange(optimisticAgeGroupFilter),
				},
			});

			if (latestPatientsTableRequestIdRef.current !== patientsTableRequestId) {
				return;
			}

			setTableData({
				patients: result.patients,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(tableData.limit),
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
		latestPatientsTableRequestIdRef.current += 1;
		const patientsTableRequestId = latestPatientsTableRequestIdRef.current;

		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticCreatedAtRange({
				createdFrom: nextCreatedFrom,
				createdTo: nextCreatedTo,
			});

			const result = await getPatientsTableAction({
				page: 1,
				limit: tableData.limit,
				query: patientSearchQuery,
				createdAtFilter: {
					from: parseDateBoundaryParam(nextCreatedFrom, "start"),
					to: parseDateBoundaryParam(nextCreatedTo, "end"),
				},
				patientFilterOptions: {
					gender: optimisticGenderFilter || undefined,
					ageRange: getPatientAgeRange(optimisticAgeGroupFilter),
				},
			});

			if (latestPatientsTableRequestIdRef.current !== patientsTableRequestId) {
				return;
			}

			setTableData({
				patients: result.patients,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(tableData.limit),
						createdFrom: nextCreatedFrom,
						createdTo: nextCreatedTo,
					})) as Route,
			);
		});
	}

	function handleGenderFilterChange(nextGenderFilter: PatientGenderFilter) {
		latestPatientsTableRequestIdRef.current += 1;
		const patientsTableRequestId = latestPatientsTableRequestIdRef.current;

		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticGenderFilter(nextGenderFilter);

			const result = await getPatientsTableAction({
				page: 1,
				limit: tableData.limit,
				query: patientSearchQuery,
				createdAtFilter: {
					from: parseDateBoundaryParam(optimisticCreatedAtRange.createdFrom, "start"),
					to: parseDateBoundaryParam(optimisticCreatedAtRange.createdTo, "end"),
				},
				patientFilterOptions: {
					gender: nextGenderFilter || undefined,
					ageRange: getPatientAgeRange(optimisticAgeGroupFilter),
				},
			});

			if (latestPatientsTableRequestIdRef.current !== patientsTableRequestId) {
				return;
			}

			setTableData({
				patients: result.patients,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(tableData.limit),
						gender: nextGenderFilter,
					})) as Route,
			);
		});
	}

	function handleAgeGroupFilterChange(nextAgeGroupFilter: PatientAgeGroupFilter) {
		latestPatientsTableRequestIdRef.current += 1;
		const patientsTableRequestId = latestPatientsTableRequestIdRef.current;

		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticAgeGroupFilter(nextAgeGroupFilter);

			const result = await getPatientsTableAction({
				page: 1,
				limit: tableData.limit,
				query: patientSearchQuery,
				createdAtFilter: {
					from: parseDateBoundaryParam(optimisticCreatedAtRange.createdFrom, "start"),
					to: parseDateBoundaryParam(optimisticCreatedAtRange.createdTo, "end"),
				},
				patientFilterOptions: {
					gender: optimisticGenderFilter || undefined,
					ageRange: getPatientAgeRange(nextAgeGroupFilter),
				},
			});

			if (latestPatientsTableRequestIdRef.current !== patientsTableRequestId) {
				return;
			}

			setTableData({
				patients: result.patients,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(tableData.limit),
						ageGroup: nextAgeGroupFilter,
					})) as Route,
			);
		});
	}

	function handleQueryChange(nextQuery: string) {
		setPatientSearchQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		latestPatientsTableRequestIdRef.current += 1;
		const patientsTableRequestId = latestPatientsTableRequestIdRef.current;
		const previousPage = tableData.page - 1;

		startTransition(async () => {
			setOptimisticPage(previousPage);

			const result = await getPatientsTableAction({
				page: previousPage,
				limit: tableData.limit,
				query: patientSearchQuery,
				createdAtFilter: {
					from: parseDateBoundaryParam(optimisticCreatedAtRange.createdFrom, "start"),
					to: parseDateBoundaryParam(optimisticCreatedAtRange.createdTo, "end"),
				},
				patientFilterOptions: {
					gender: optimisticGenderFilter || undefined,
					ageRange: getPatientAgeRange(optimisticAgeGroupFilter),
				},
			});

			if (latestPatientsTableRequestIdRef.current !== patientsTableRequestId) {
				return;
			}

			setTableData({
				patients: result.patients,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: String(result.page),
						limit: String(result.limit),
					})) as Route,
			);
		});
	}

	function handleNextPage() {
		latestPatientsTableRequestIdRef.current += 1;
		const patientsTableRequestId = latestPatientsTableRequestIdRef.current;
		const nextPage = tableData.page + 1;

		startTransition(async () => {
			setOptimisticPage(nextPage);

			const result = await getPatientsTableAction({
				page: nextPage,
				limit: tableData.limit,
				query: patientSearchQuery,
				createdAtFilter: {
					from: parseDateBoundaryParam(optimisticCreatedAtRange.createdFrom, "start"),
					to: parseDateBoundaryParam(optimisticCreatedAtRange.createdTo, "end"),
				},
				patientFilterOptions: {
					gender: optimisticGenderFilter || undefined,
					ageRange: getPatientAgeRange(optimisticAgeGroupFilter),
				},
			});

			if (latestPatientsTableRequestIdRef.current !== patientsTableRequestId) {
				return;
			}

			setTableData({
				patients: result.patients,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: String(result.page),
						limit: String(result.limit),
					})) as Route,
			);
		});
	}

	function handleLimitChange(value: string) {
		latestPatientsTableRequestIdRef.current += 1;
		const patientsTableRequestId = latestPatientsTableRequestIdRef.current;
		const nextLimit = Number(value);

		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticLimit(nextLimit);

			const result = await getPatientsTableAction({
				page: 1,
				limit: nextLimit,
				query: patientSearchQuery,
				createdAtFilter: {
					from: parseDateBoundaryParam(optimisticCreatedAtRange.createdFrom, "start"),
					to: parseDateBoundaryParam(optimisticCreatedAtRange.createdTo, "end"),
				},
				patientFilterOptions: {
					gender: optimisticGenderFilter || undefined,
					ageRange: getPatientAgeRange(optimisticAgeGroupFilter),
				},
			});

			if (latestPatientsTableRequestIdRef.current !== patientsTableRequestId) {
				return;
			}

			setTableData({
				patients: result.patients,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});

			router.push(
				(pathname +
					"?" +
					createQueryString({ page: String(result.page), limit: String(result.limit) })) as Route,
			);
		});
	}

	return (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-200 bg-white px-6 h-14 flex items-center sticky top-0 z-20 shrink-0 text-sm">
				<h1 className="text-xl font-semibold text-balance text-gray-800 tracking-[-0.015em]">
					Patients
				</h1>
				<div className="flex items-center gap-2 flex-1 justify-end">
					<div className="relative min-w-[12.5rem] max-w-[31.25rem] flex-1">
						<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
						<Input
							type="search"
							className="pl-8"
							placeholder="Search by patient name or ID"
							value={patientSearchQuery}
							onChange={(event) => handleQueryChange(event.target.value)}
						/>
					</div>

					<FilterButton
						ageGroupFilter={optimisticAgeGroupFilter}
						createdFrom={optimisticCreatedAtRange.createdFrom}
						createdTo={optimisticCreatedAtRange.createdTo}
						genderFilter={optimisticGenderFilter}
						isPending={isPending}
						onAgeGroupFilterChange={handleAgeGroupFilterChange}
						onCreatedAtRangeApply={handleCreatedAtRangeApply}
						onGenderFilterChange={handleGenderFilterChange}
					/>
					<Button variant="outline" className="bg-white text-sm text-gray-600 hover:bg-gray-50">
						<RiShare2Line aria-hidden className="size-5 text-gray-600" />
						Export
					</Button>

					<Button className="text-sm" asChild>
						<Link href="/dashboard/add-new-patient">Add patient</Link>
					</Button>
				</div>
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto">
				<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
					<PatientActiveFilterPills
						ageGroupFilter={optimisticAgeGroupFilter}
						createdFrom={optimisticCreatedAtRange.createdFrom}
						createdTo={optimisticCreatedAtRange.createdTo}
						genderFilter={optimisticGenderFilter}
						onAgeGroupFilterChange={handleAgeGroupFilterChange}
						onCreatedAtRangeApply={handleCreatedAtRangeApply}
						onGenderFilterChange={handleGenderFilterChange}
					/>
					<PatientsTable
						patients={tableData.patients}
						page={optimisticPage}
						limit={optimisticLimit}
						totalPages={tableData.totalPages}
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

function PatientActiveFilterPills({
	ageGroupFilter,
	createdFrom,
	createdTo,
	genderFilter,
	onAgeGroupFilterChange,
	onCreatedAtRangeApply,
	onGenderFilterChange,
}: {
	ageGroupFilter: PatientAgeGroupFilter;
	createdFrom: string;
	createdTo: string;
	genderFilter: PatientGenderFilter;
	onAgeGroupFilterChange: (ageGroupFilter: PatientAgeGroupFilter) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onGenderFilterChange: (genderFilter: PatientGenderFilter) => void;
}) {
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);

	if (!ageGroupFilter && !genderFilter && !hasCreatedAtFilter) {
		return null;
	}

	return (
		<div className="mb-4 flex flex-wrap gap-2">
			{genderFilter ? (
				<PatientFilterPill
					label={`Gender: ${patientGenderFilterLabels[genderFilter]}`}
					onRemove={() => onGenderFilterChange("")}
				/>
			) : null}
			{ageGroupFilter ? (
				<PatientFilterPill
					label={`Age: ${patientAgeGroupFilterLabels[ageGroupFilter]}`}
					onRemove={() => onAgeGroupFilterChange("")}
				/>
			) : null}
			{hasCreatedAtFilter ? (
				<PatientFilterPill
					label={`Created: ${formatDateRangeFilterLabel(createdFrom, createdTo)}`}
					onRemove={() => onCreatedAtRangeApply("", "")}
				/>
			) : null}
		</div>
	);
}

function PatientFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
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

function getPatientAgeRange(ageGroup: PatientAgeGroupFilter) {
	switch (ageGroup) {
		case "children":
			return { min: 0, max: 12 };

		case "teenagers":
			return { min: 13, max: 17 };

		case "young-adults":
			return { min: 18, max: 35 };

		case "adults":
			return { min: 36, max: 59 };

		case "seniors":
			return { min: 60 };

		default:
			return undefined;
	}
}
