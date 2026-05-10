"use client";

import { RiArrowDownSLine, RiSearchLine } from "@remixicon/react";
import { useMemo, useState } from "react";
import { Tabs } from "radix-ui";
import { motion } from "motion/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MultiSelectItem } from "@/components/multi-select-item";
import { clinicalRecordItemsByType, clinicalRecords } from "@/features/transfers/data";
import { useAttachClinicalRecords } from "@/features/transfers/stores/use-attach-clinical-records";
import { cn } from "@/lib/utils/cn";
import { Label } from "@/components/ui/label";

type AttachClinicalRecordsProps = {
	activePatient: string;
};

export function AttachClinicalRecords({ activePatient }: AttachClinicalRecordsProps) {
	const { attachedRecords, toggleAttachedRecord } = useAttachClinicalRecords();
	const [activeTabId, setActiveTabId] = useState(clinicalRecords[0].id);
	const [searchQuery, setSearchQuery] = useState("");

	const allSelectedRecordsForPatient = attachedRecords[activePatient] ?? [];

	const activeTab =
		clinicalRecords.find((record) => record.id === activeTabId) ?? clinicalRecords[0];

	const recordsForActiveTab = clinicalRecordItemsByType[activeTabId] ?? [];
	const normalizedSearchQuery = searchQuery.trim().toLowerCase();

	const filteredRecordsForActiveTab = recordsForActiveTab.filter((record) =>
		record.name.toLowerCase().includes(normalizedSearchQuery),
	);

	const selectedRecordsIds = useMemo(
		() => new Set(allSelectedRecordsForPatient.map((record) => record.id)),
		[allSelectedRecordsForPatient],
	);

	const activeTabRecordIds = useMemo(
		() => new Set(recordsForActiveTab.map((record) => record.id)),
		[recordsForActiveTab],
	);

	const selectedRecordsForActiveTab = allSelectedRecordsForPatient.filter((record) =>
		activeTabRecordIds.has(record.id),
	);

	const selectedVisibleRecordsCount = filteredRecordsForActiveTab.filter((record) =>
		selectedRecordsIds.has(record.id),
	).length;

	const areAllVisibleRecordsSelected =
		filteredRecordsForActiveTab.length > 0 &&
		selectedVisibleRecordsCount === filteredRecordsForActiveTab.length;

	const areSomeVisibleRecordsSelected =
		selectedVisibleRecordsCount > 0 &&
		selectedVisibleRecordsCount < filteredRecordsForActiveTab.length;

	function handleSelectAllVisibleRecords() {
		filteredRecordsForActiveTab.forEach(({ id, name }) => {
			const isSelected = selectedRecordsIds.has(id);

			if (areAllVisibleRecordsSelected ? isSelected : !isSelected) {
				toggleAttachedRecord(activePatient, { id, label: name });
			}
		});
	}

	return (
		<div className="mt-8 flex flex-col gap-3.5 items-start">
			<span className="text-gray-600 font-medium">
				Attach Clinical Records <span className="text-gray-400 font-normal">(required)</span>
			</span>

			<Tabs.Root value={activeTabId} onValueChange={setActiveTabId} className="w-full">
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
										transition={{ type: "spring", stiffness: 400, damping: 30 }}
									/>
								)}
								<span className="relative z-10">{record.label}</span>
							</Tabs.Trigger>
						);
					})}
				</Tabs.List>
			</Tabs.Root>

			<Popover>
				<PopoverTrigger className="group flex h-11 items-center justify-between gap-4 w-full border border-input px-4 py-2 text-left outline-0 rounded-md focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
					{selectedRecordsForActiveTab.length === 0 ? (
						<div className="text-gray-500 whitespace-nowrap overflow-hidden gap-2 ">
							<span className="w-full shrink-0">
								Select {activeTab.label.toLowerCase()} records
							</span>
						</div>
					) : (
						<div className="flex gap-1.5 items-center text-sm text-foreground">
							<span className="flex items-center">{selectedRecordsForActiveTab[0].label}</span>
							{selectedRecordsForActiveTab.length - 1 > 0 && (
								<span> +{selectedRecordsForActiveTab.length - 1} more</span>
							)}
						</div>
					)}
					<RiArrowDownSLine className="size-5 text-gray-400 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
				</PopoverTrigger>

				<PopoverContent sideOffset={8} className="flex flex-col gap-1 rounded-2xl p-2">
					<div className="relative">
						<RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
						<Input
							type="search"
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder={`Search ${activeTab.label.toLowerCase()} records`}
							className="h-10 pl-9"
						/>
					</div>
					<div
						className={cn(
							"flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-gray-600",
							filteredRecordsForActiveTab.length === 0 && "opacity-50",
						)}
					>
						<Label>
							<Checkbox
								checked={
									areAllVisibleRecordsSelected || (areSomeVisibleRecordsSelected && "indeterminate")
								}
								aria-label={`Select all ${activeTab.label.toLowerCase()} records`}
								disabled={filteredRecordsForActiveTab.length === 0}
								onCheckedChange={handleSelectAllVisibleRecords}
							/>
							<span>Select all</span>
						</Label>
					</div>
					{filteredRecordsForActiveTab.map(({ id, name }) => (
						<MultiSelectItem
							key={id}
							isSelected={selectedRecordsIds.has(id)}
							onClick={() => toggleAttachedRecord(activePatient, { id, label: name })}
						>
							{name}
						</MultiSelectItem>
					))}
					{filteredRecordsForActiveTab.length === 0 && (
						<div className="px-3 py-2 text-sm text-gray-500">No records found</div>
					)}
				</PopoverContent>
			</Popover>
		</div>
	);
}
