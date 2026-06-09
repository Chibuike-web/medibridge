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
import { useState, useTransition } from "react";
import { getTransferPatientOptionsAction } from "@/features/transfers/server/actions";

function truncatePatientId(id: string) {
	if (id.length <= 13) return id;

	return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

export function SelectPatient({
	patientId,
	patients,
	page,
	limit,
	totalPages,
}: {
	patientId?: string;
	patients: SelectedTransferPatient[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [searchTerm, setSearchTerm] = useState("");
	const [patientOptions, setPatientOptions] = useState(patients);
	const [currentPage, setCurrentPage] = useState(page);
	const [currentTotalPages, setCurrentTotalPages] = useState(totalPages);
	const [isPending, startTransition] = useTransition();
	const { removeAttachedRecords } = useAttachClinicalRecords();

	const router = useRouter();
	const { selectedPatients, toggleSelectedPatient, removeSelectedPatient } =
		useSelectedTransferPatients();

	const selectedCount = selectedPatients.length;
	const selectedSummary =
		selectedCount === 0 ? (
			"Select patient"
		) : selectedCount === 1 ? (
			<div className="flex items-center gap-2">
				<span>{selectedPatients[0].name}</span>
				<span className="p-1 rounded bg-white text-xs border" title={selectedPatients[0].patientId}>
					{truncatePatientId(selectedPatients[0].patientId)}
				</span>
			</div>
		) : (
			`${selectedPatients[0].name} +${selectedCount - 1} more`
		);

	function handlePageChange(nextPage: number) {
		if (nextPage < 1 || nextPage > currentTotalPages || isPending) return;

		startTransition(async () => {
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
					<div className="flex items-center gap-2 px-4 py-4 text-gray-400">
						<RiSearchLine className="size-5 shrink-0" />
						<input
							className="h-10 min-w-0 flex-1 bg-transparent text-base text-gray-700 placeholder:text-gray-400 focus:outline-0"
							type="search"
							placeholder="Search by name and patient ID"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
						/>
					</div>
					<div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 pb-3">
						{patientOptions.length === 0 ? (
							<p className="px-3 py-4 text-sm text-gray-500">No patients available.</p>
						) : (
							patientOptions.map((patient) => {
								const isSelected = selectedPatients.some(
									(item) => item.patientId === patient.patientId,
								);

								return (
									<button
										key={patient.patientId + patient.name}
										type="button"
										onClick={() => toggleSelectedPatient(patient)}
										className={cn(
											"px-3 py-2 rounded-lg text-base w-full text-left flex items-center justify-between",
											isSelected
												? "bg-foreground/5 text-foreground"
												: "text-gray-600 hover:bg-gray-50",
										)}
									>
										<div className="flex items-center gap-3">
											<span className="font-medium">{patient.name}</span>
											<span className="p-1 rounded bg-white text-xs border" title={patient.patientId}>
												{truncatePatientId(patient.patientId)}
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
							disabled={currentPage <= 1 || isPending}
							className="justify-self-start border-gray-200 px-3 text-gray-700 shadow-none transition"
						>
							Previous
						</Button>
						<span className="justify-self-center text-sm font-medium text-gray-600">
							Page {currentPage} of {currentTotalPages}
						</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={currentPage >= currentTotalPages || isPending}
							className="justify-self-end border-gray-200 px-3 text-gray-700 shadow-none transition"
						>
							Next
						</Button>
					</div>
				</PopoverContent>
			</Popover>
			<div className="flex items-center gap-3 flex-wrap">
				{selectedPatients.map((s) => (
					<div
						key={s.patientId}
						className="text-sm bg-gray-200 text-gray-600 flex items-center gap-2 py-1.5 pl-3 pr-1.5 rounded-full"
					>
						{s.name} - <span title={s.patientId}>{truncatePatientId(s.patientId)}</span>
						<button
							type="button"
							className="bg-gray-800 size-5 flex items-center justify-center text-white rounded-full active:scale-[0.90] transition-transform"
							onClick={() => {
								removeSelectedPatient(s);

								if (s.patientId === patientId) {
									router.replace("/dashboard/new-transfer-request");
								}
								removeAttachedRecords(s.patientId);
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
