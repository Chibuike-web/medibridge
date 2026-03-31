"use client";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useSelectedTransferPatients } from "@/features/transfers/stores/use-selected-transfer-patients";
import { useMemo, useState } from "react";
import { patients } from "@/features/transfers/data";
import { RiArrowDownSLine, RiCheckLine, RiCloseLine, RiSearchLine } from "@remixicon/react";
import { cn } from "@/lib/utils/cn";

export function SelectPatient() {
	const [searchTerm, setSearchTerm] = useState("");
	const { selectedPatients, toggleSelectedPatient, removeSelectedPatient } =
		useSelectedTransferPatients();

	const selectedCount = selectedPatients.length;
	const selectedSummary =
		selectedCount === 0 ? (
			"Select patient"
		) : selectedCount === 1 ? (
			<div className="flex items-center gap-2">
				<span>{selectedPatients[0].name}</span>
				<span className="p-1 rounded bg-white text-xs border">{selectedPatients[0].patientId}</span>
			</div>
		) : (
			`${selectedPatients[0].name} +${selectedCount - 1} more`
		);

	const filteredPatients = useMemo(() => {
		const normalizedSearchTerm = searchTerm.trim().toLowerCase();
		if (!normalizedSearchTerm) return patients;

		return patients.filter((patient) => {
			return (
				patient.name.toLowerCase().includes(normalizedSearchTerm) ||
				patient.patientId.toLowerCase().includes(normalizedSearchTerm)
			);
		});
	}, [searchTerm]);

	return (
		<div className="flex flex-col gap-3.5 items-start">
			<span className="text-gray-800 text-base block">Select Patient</span>
			<Popover>
				<PopoverTrigger className="group flex h-11 items-center justify-between gap-4 w-full border border-input px-4 py-2 text-left outline-0 rounded-md focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
					<span className="text-base truncate">{selectedSummary}</span>
					<RiArrowDownSLine className="size-5 text-gray-400 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
				</PopoverTrigger>

				<PopoverContent sideOffset={8} className="rounded-2xl h-[18.75rem] flex flex-col p-1.5">
					<div className="flex items-center gap-2 mb-2 text-gray-400 pl-2">
						<RiSearchLine className="size-5" />
						<input
							className="h-10 placeholder:text-base focus:outline-0 w-full"
							type="search"
							placeholder="Search by name and patient ID"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-1 overflow-y-auto">
						{filteredPatients.length === 0 ? (
							<p className="px-3 py-4 text-sm text-gray-500">No patients match your search.</p>
						) : (
							filteredPatients.map((patient) => {
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
											<span className="p-1 rounded bg-white text-xs border">
												{patient.patientId}
											</span>
										</div>
										{isSelected ? <RiCheckLine className="size-4" /> : null}
									</button>
								);
							})
						)}
					</div>
				</PopoverContent>
			</Popover>
			<div className="flex items-center gap-3 flex-wrap">
				{selectedPatients.map((s) => (
					<div
						key={s.patientId}
						className="text-sm bg-gray-200 text-gray-600 flex items-center gap-2 py-1.5 pl-3 pr-1.5 rounded-full"
					>
						{s.name} - {s.patientId}
						<button
							type="button"
							className="bg-gray-800 size-5 flex items-center justify-center text-white rounded-full"
							onClick={() => removeSelectedPatient(s)}
						>
							<RiCloseLine size={16} />
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
