"use client";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
	type SelectedTransferPatient,
	useSelectedTransferPatients,
} from "@/features/transfers/stores/use-selected-transfer-patients";
import { RiArrowDownSLine, RiCheckLine, RiCloseLine, RiSearchLine } from "@remixicon/react";
import { cn } from "@/lib/utils/cn";
import { useRouter } from "next/navigation";
import { useAttachClinicalRecords } from "../stores/use-attach-clinical-records";
import { useOptimistic, useState, useTransition } from "react";
import { getTransferPatientOptionsAction } from "@/features/transfers/server/actions";
import { truncateId } from "@/lib/utils/truncate-id";
import type { Route } from "next";

export function SelectPatient({
	patientId,
	clearPatientIdHref,
	patients,
	page,
	limit,
	totalPages,
}: {
	patientId?: string;
	clearPatientIdHref?: Route;
	patients: SelectedTransferPatient[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [searchTerm, setSearchTerm] = useState("");
	const [patientOptions, setPatientOptions] = useState(patients);
	const [currentPage, setCurrentPage] = useState(page);
	const [currentTotalPages, setCurrentTotalPages] = useState(totalPages);
	const [optimisticPage, setOptimisticPage] = useOptimistic(currentPage);
	const [isUpdatingPatientOptionsPage, startPatientOptionsPageTransition] = useTransition();
	const { removeAttachedClinicalRecordsForPatient } = useAttachClinicalRecords();

	const router = useRouter();
	const { selectedTransferPatients, toggleSelectedTransferPatient, removeSelectedTransferPatient } =
		useSelectedTransferPatients();

	const selectedCount = selectedTransferPatients.length;
	const selectedSummary =
		selectedCount === 0 ? (
			"Select patient"
		) : selectedCount === 1 ? (
			<div className="flex items-center gap-2">
				<span>{selectedTransferPatients[0].name}</span>
				<span
					className="p-1 rounded bg-white text-xs border"
					title={selectedTransferPatients[0].patientId}
				>
					{truncateId(selectedTransferPatients[0].patientId)}
				</span>
			</div>
		) : (
			`${selectedTransferPatients[0].name} +${selectedCount - 1} more`
		);

	function handlePageChange(nextPage: number) {
		if (nextPage < 1 || nextPage > currentTotalPages || isUpdatingPatientOptionsPage) return;

		startPatientOptionsPageTransition(async () => {
			setOptimisticPage(nextPage);

			const result = await getTransferPatientOptionsAction({
				page: nextPage,
				limit,
			});

			setPatientOptions(result.patients);
			setCurrentPage(result.page);
			setCurrentTotalPages(result.totalPages);
		});
	}

	return (
		<div className="flex flex-col gap-3.5 items-start">
			<span className="text-gray-800 text-base block">Select Patient</span>
			<Popover>
				<PopoverTrigger className="group flex h-11 items-center justify-between gap-4 w-full border border-input px-4 py-2 text-left outline-0 rounded-md focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
					<span className="text-base truncate">{selectedSummary}</span>
					<RiArrowDownSLine className="size-5 text-gray-400 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
				</PopoverTrigger>

				<PopoverContent sideOffset={8} className="rounded-2xl h-[24rem] flex flex-col p-0">
					<div className="flex items-center gap-2 px-4 py-2 text-gray-400 border-b border-gray-200">
						<RiSearchLine className="size-5 shrink-0" />
						<input
							className="h-10 min-w-0 flex-1 bg-transparent text-base text-gray-700 placeholder:text-gray-400 focus:outline-0"
							type="search"
							placeholder="Search by name and patient ID"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-1 overflow-y-auto px-4 py-3">
						{patientOptions.length === 0 ? (
							<p className="px-3 py-4 text-sm text-gray-500">No patients available.</p>
						) : (
							patientOptions.map((patient) => {
								const isSelected = selectedTransferPatients.some(
									(item) => item.patientId === patient.patientId,
								);

								return (
									<button
										key={patient.patientId + patient.name}
										type="button"
										onClick={() => toggleSelectedTransferPatient(patient)}
										className={cn(
											"flex w-full text-left items-center justify-between rounded-md px-3 h-11 text-sm shrink-0",
											isSelected ? "bg-gray-200 text-foreground" : "text-gray-600 hover:bg-gray-50",
										)}
									>
										<div className="flex items-center gap-3">
											<span className="font-medium">{patient.name}</span>
											<span
												className="p-1 rounded-sm bg-white text-xs border"
												title={patient.patientId}
											>
												{truncateId(patient.patientId)}
											</span>
										</div>
										{isSelected ? <RiCheckLine className="size-4" /> : null}
									</button>
								);
							})
						)}
					</div>
					<div className="grid grid-cols-3 items-center border-t border-gray-200 px-6 py-4">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => handlePageChange(currentPage - 1)}
							disabled={optimisticPage <= 1 || isUpdatingPatientOptionsPage}
							className="justify-self-start border-gray-200 px-3 text-gray-700 shadow-none transition"
						>
							Previous
						</Button>
						<span className="justify-self-center text-sm font-medium text-gray-600">
							Page {optimisticPage} of {currentTotalPages}
						</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={optimisticPage >= currentTotalPages || isUpdatingPatientOptionsPage}
							className="justify-self-end border-gray-200 px-3 text-gray-700 shadow-none transition"
						>
							Next
						</Button>
					</div>
				</PopoverContent>
			</Popover>
			<div className="flex items-center gap-3 flex-wrap">
				{selectedTransferPatients.map((s) => (
					<div
						key={s.patientId}
						className="text-sm bg-gray-200 text-gray-600 flex items-center gap-2 py-1.5 pl-3 pr-1.5 rounded-full"
					>
						{s.name} - <span title={s.patientId}>{truncateId(s.patientId)}</span>
						<button
							type="button"
							className="bg-gray-800 size-5 flex items-center justify-center text-white rounded-full active:scale-[0.90] transition-transform"
							onClick={() => {
								removeSelectedTransferPatient(s);

								if (s.patientId === patientId) {
									router.replace(clearPatientIdHref ?? "/dashboard/new-transfer-request");
								}
								removeAttachedClinicalRecordsForPatient(s.patientId);
							}}
						>
							<RiCloseLine size={16} />
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
