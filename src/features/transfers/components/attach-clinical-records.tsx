"use client";

import { RiArrowDownSLine, RiSearchLine } from "@remixicon/react";
import { useMemo, useState } from "react";
import { Tabs } from "radix-ui";
import { motion, useReducedMotion } from "motion/react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MultiSelectItem } from "@/components/multi-select-item";
import { clinicalRecords } from "@/features/transfers/data";
import { useAttachClinicalRecords } from "@/features/transfers/stores/use-attach-clinical-records";
import type { ClinicalRecordItem } from "@/features/transfers/types";
import { cn } from "@/lib/utils/cn";

type ClinicalRecordOptionsData = {
	records: ClinicalRecordItem[];
	page: number;
	totalPages: number;
	totalRecords: number;
};

const clinicalRecordOptionsLimit = 8;

export function AttachClinicalRecords({ activePatient }: { activePatient: string }) {
	const { attachedClinicalRecordsByPatientId, toggleAttachedClinicalRecordForPatient } =
		useAttachClinicalRecords();
	const [activeTabId, setActiveTabId] = useState(clinicalRecords[0].id);
	const [searchQuery, setSearchQuery] = useState("");
	const [clinicalRecordOptionsPage, setClinicalRecordOptionsPage] = useState(1);
	const shouldReduceMotion = useReducedMotion();

	const allSelectedRecordsForPatient = attachedClinicalRecordsByPatientId[activePatient] ?? [];
	const activeTab =
		clinicalRecords.find((record) => record.id === activeTabId) ?? clinicalRecords[0];
	const normalizedSearchQuery = searchQuery.trim().toLowerCase();

	const clinicalRecordOptionsQuery = useSWR(
		activePatient
			? ([
					"transfer-clinical-record-options",
					activePatient,
					activeTabId,
					clinicalRecordOptionsPage,
					clinicalRecordOptionsLimit,
					normalizedSearchQuery,
				] as const)
			: null,
		async ([, patientId, type, page, limit, query]) =>
			fetchClinicalRecordOptions({ patientId, type, page, limit, query }),
		{ keepPreviousData: true },
	);

	const clinicalRecordOptionsData = clinicalRecordOptionsQuery.data;
	const recordsForActiveTab = clinicalRecordOptionsData?.records ?? [];
	const currentTotalPages = clinicalRecordOptionsData?.totalPages ?? 1;
	const totalRecordsForActiveTab = clinicalRecordOptionsData?.totalRecords ?? 0;
	const isUpdatingClinicalRecordOptions =
		clinicalRecordOptionsQuery.isLoading || clinicalRecordOptionsQuery.isValidating;

	const selectedRecordIds = useMemo(
		() => new Set(allSelectedRecordsForPatient.map((record) => record.id)),
		[allSelectedRecordsForPatient],
	);
	const selectedRecordsForActiveTab = allSelectedRecordsForPatient.filter(
		(record) => record.type === activeTab.label,
	);
	const selectedVisibleRecordsCount = recordsForActiveTab.filter((record) =>
		selectedRecordIds.has(record.id),
	).length;
	const areAllVisibleRecordsSelected =
		recordsForActiveTab.length > 0 && selectedVisibleRecordsCount === recordsForActiveTab.length;
	const areSomeVisibleRecordsSelected =
		selectedVisibleRecordsCount > 0 && selectedVisibleRecordsCount < recordsForActiveTab.length;

	function handleSelectAllVisibleRecords() {
		recordsForActiveTab.forEach(({ id, name }) => {
			const isSelected = selectedRecordIds.has(id);

			if (areAllVisibleRecordsSelected ? isSelected : !isSelected) {
				toggleAttachedClinicalRecordForPatient(activePatient, { id, name, type: activeTab.label });
			}
		});
	}

	function handleTabChange(nextActiveTabId: string) {
		setActiveTabId(nextActiveTabId);
		setClinicalRecordOptionsPage(1);
	}

	function handleSearchQueryChange(nextSearchQuery: string) {
		setSearchQuery(nextSearchQuery);
		setClinicalRecordOptionsPage(1);
	}

	function handlePageChange(nextPage: number) {
		if (nextPage < 1 || nextPage > currentTotalPages || isUpdatingClinicalRecordOptions) return;

		setClinicalRecordOptionsPage(nextPage);
	}

	return (
		<div className="mt-8">
			<span className="mb-2 block text-sm font-medium text-gray-600">
				Attach Clinical Records <span className="text-gray-400 font-normal">(required)</span>
			</span>

			<Tabs.Root value={activeTabId} onValueChange={handleTabChange} className="w-full">
				<Tabs.List className="flex w-full flex-wrap gap-1.5">
					{clinicalRecords.map((record) => {
						const isActive = activeTabId === record.id;

						return (
							<Tabs.Trigger
								key={record.id}
								value={record.id}
								className={cn(
									"relative shrink-0 rounded-full p-2.5 text-sm leading-none transition-colors",
									isActive ? "text-white" : "text-gray-500 hover:text-gray-800",
								)}
							>
								{isActive && (
									<motion.span
										layoutId="attach-record-tab"
										className="absolute inset-0 rounded-full bg-gray-800"
										transition={
											shouldReduceMotion
												? { duration: 0 }
												: { type: "spring", duration: 0.24, bounce: 0.05 }
										}
									/>
								)}
								<span className="relative z-10">{record.label}</span>
							</Tabs.Trigger>
						);
					})}
				</Tabs.List>
			</Tabs.Root>

			<Popover>
				<PopoverTrigger className="group mt-3 flex h-9 w-full items-center justify-between gap-4 rounded-md border border-input px-4 py-2 text-left outline-0 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
					{selectedRecordsForActiveTab.length === 0 ? (
						<span className="truncate text-sm text-gray-500">
							Select {activeTab.label.toLowerCase()} records
						</span>
					) : (
						<span className="truncate text-sm text-foreground">
							{selectedRecordsForActiveTab.length} selected in {activeTab.label}
						</span>
					)}
					<RiArrowDownSLine className="size-5 shrink-0 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
				</PopoverTrigger>

				<PopoverContent sideOffset={8} className="flex h-[24rem] flex-col rounded-2xl p-0">
					<div className="flex shrink-0 items-center gap-2 border-b border-gray-200 px-4 py-2 text-gray-400">
						<RiSearchLine className="size-4" />
						<input
							className="h-9 w-full placeholder:text-sm placeholder:text-gray-400 focus:outline-0"
							type="search"
							value={searchQuery}
							onChange={(event) => handleSearchQueryChange(event.target.value)}
							placeholder={`Search ${activeTab.label.toLowerCase()} records`}
						/>
					</div>

					<div
						className={cn(
							"flex h-12 w-full shrink-0 items-center gap-3 rounded-md px-5 text-left text-sm text-gray-600",
							recordsForActiveTab.length === 0 && "opacity-50",
						)}
					>
						<Label className="h-full w-full">
							<Checkbox
								checked={
									areAllVisibleRecordsSelected ||
									(areSomeVisibleRecordsSelected && "indeterminate")
								}
								aria-label={`Select all ${activeTab.label.toLowerCase()} records`}
								disabled={recordsForActiveTab.length === 0}
								onCheckedChange={handleSelectAllVisibleRecords}
							/>
							<span>Select all visible</span>
							<span className="ml-auto text-xs text-gray-400">
								{selectedVisibleRecordsCount} of {recordsForActiveTab.length} selected
							</span>
						</Label>
					</div>

					<div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
						<div className="flex flex-col gap-1">
							{isUpdatingClinicalRecordOptions &&
								recordsForActiveTab.length === 0 &&
								Array.from({ length: 5 }).map((_, index) => (
									<div
										key={index}
										className="h-9 w-full animate-pulse rounded-md bg-gray-100"
									/>
								))}

							{!isUpdatingClinicalRecordOptions && recordsForActiveTab.length === 0 && (
								<div className="px-3 py-4 text-sm text-gray-500">
									{normalizedSearchQuery
										? `No ${activeTab.label.toLowerCase()} match "${searchQuery.trim()}".`
										: `No ${activeTab.label.toLowerCase()} available for this patient.`}
								</div>
							)}

							{recordsForActiveTab.map(({ id, name, createdAt }) => (
								<MultiSelectItem
									key={id}
									isSelected={selectedRecordIds.has(id)}
									onClick={() =>
										toggleAttachedClinicalRecordForPatient(activePatient, {
											id,
											name,
											type: activeTab.label,
										})
									}
								>
									<span className="flex min-w-0 flex-col">
										<span className="truncate">{name}</span>
										{createdAt ? (
											<span className="text-xs font-normal text-gray-400">{createdAt}</span>
										) : null}
									</span>
								</MultiSelectItem>
							))}
						</div>
					</div>

					<div className="grid shrink-0 grid-cols-3 items-center border-t border-gray-200 p-4 text-sm">
						<Button
							type="button"
							variant="outline"
							onClick={() => handlePageChange(clinicalRecordOptionsPage - 1)}
							disabled={clinicalRecordOptionsPage <= 1 || isUpdatingClinicalRecordOptions}
							className="justify-self-start border-gray-200 px-3 text-gray-700 shadow-none transition"
						>
							Previous
						</Button>
						<span className="justify-self-center text-center text-sm font-medium text-gray-600">
							Page {clinicalRecordOptionsPage} of {currentTotalPages}
							<span className="block text-xs font-normal text-gray-400">
								{totalRecordsForActiveTab} total
							</span>
						</span>
						<Button
							type="button"
							variant="outline"
							onClick={() => handlePageChange(clinicalRecordOptionsPage + 1)}
							disabled={
								clinicalRecordOptionsPage >= currentTotalPages || isUpdatingClinicalRecordOptions
							}
							className="justify-self-end border-gray-200 px-3 text-gray-700 shadow-none transition"
						>
							Next
						</Button>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}

async function fetchClinicalRecordOptions({
	patientId,
	type,
	page,
	limit,
	query,
}: {
	patientId: string;
	type: string;
	page: number;
	limit: number;
	query: string;
}) {
	const params = new URLSearchParams({
		patientId,
		type,
		page: String(page),
		limit: String(limit),
		query,
	});
	const response = await fetch(`/api/transfer-clinical-record-options?${params.toString()}`);

	if (!response.ok) {
		throw new Error("Unable to load clinical record options.");
	}

	return (await response.json()) as ClinicalRecordOptionsData;
}
