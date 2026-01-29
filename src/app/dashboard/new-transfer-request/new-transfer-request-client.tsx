"use client";

import { Label } from "@/components/ui/label";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { patients } from "../transfers/data";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import ArrowDownLine from "@/icons/arrow-down-line";
import Check from "@/icons/check";
import { cn } from "@/lib/utils/cn";
import { ReactNode, useRef, useState } from "react";
import { SearchLine } from "@/icons/search-line";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function NewTransferRequestClient() {
	return (
		<form className="w-full">
			<SelectPatient />
			<AttachClinicalRecords />
			<SendAs />
			<div className="flex flex-col gap-3.5 mt-8">
				<Label>Target Hospital Name</Label>
				<Input className="h-11" placeholder="e.g., Enugu State Teaching Hospital" />
			</div>
			<div className="flex flex-col gap-3.5 mt-8">
				<Label>Target Hospital Name</Label>
				<Input className="h-11" placeholder="e.g., Enugu State Teaching Hospital" />
			</div>
			<div className="flex flex-col gap-3.5 mt-8">
				<Label>Target Hospital Name</Label>
				<Textarea placeholder="Add context or special instructions" />
			</div>
			<Button className="h-11 w-full mt-16">Send for Patient Approval</Button>
		</form>
	);
}

function SelectPatient() {
	const selectTriggerRef = useRef<HTMLButtonElement>(null);

	return (
		<div className="flex flex-col gap-3.5 items-start">
			<span
				className="text-gray-800 text-[1rem] block"
				onClick={() => selectTriggerRef.current?.click()}
			>
				Select Patient
			</span>
			<Select>
				<SelectTrigger className="w-full h-11 px-4" ref={selectTriggerRef}>
					<SelectValue placeholder="Select patient" className="text-[16px]" />
				</SelectTrigger>

				<SelectContent className="rounded-2xl h-[300px] flex flex-col p-1.5" align="start">
					<div className="flex items-center gap-2 mb-2 text-gray-400 pl-2">
						<SearchLine className="size-5" />
						<input
							className="h-10 placeholder:text-[16px] focus:outline-0 w-full"
							type="search"
							placeholder="Search by name, MRN, or date of birth"
						/>
					</div>
					<SelectGroup>
						{patients.map((p) => (
							<SelectItem
								key={p.hospitalId + p.name}
								value={`${p.hospitalId}-${p.name}`}
								className="h-11 px-4 rounded-[8px] text-[16px] w-full focus:bg-gray-200"
							>
								<div className="flex items-center gap-3">
									<span className="font-medium">{p.name}</span>
									<span className="p-1 rounded-lg bg-white text-[12px] border">{p.hospitalId}</span>
									<span className="p-1 rounded-lg bg-white text-[12px] border">{p.dob}</span>
								</div>
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	);
}

function AttachClinicalRecords() {
	const [clinicalRecords, setClinicalRecords] = useState(initialClinicalRecords);
	const selectedRecords = clinicalRecords.filter((r) => r.selected);
	const popoverTriggerRef = useRef<HTMLButtonElement>(null);

	const selectClinicalRecordClick = (id: string) => {
		setClinicalRecords(
			clinicalRecords.map((item) =>
				item.id === id ? { ...item, selected: !item.selected } : item,
			),
		);
	};
	return (
		<div className="mt-8 flex flex-col gap-3.5 items-start">
			<span
				className="text-gray-800 text-[1rem] block"
				onClick={() => popoverTriggerRef.current?.click()}
			>
				Attach Clinical Records
			</span>

			<Popover>
				<PopoverTrigger
					ref={popoverTriggerRef}
					className="flex min-h-[44px] items-center justify-between gap-4 w-full border border-input px-4 py-2 text-left rounded-md"
				>
					{selectedRecords.length === 0 ? (
						<div className="text-gray-500 whitespace-nowrap overflow-hidden gap-2 ">
							<span className="w-full shrink-0">Select patient records</span>
						</div>
					) : (
						<div className="flex flex-wrap gap-2">
							{selectedRecords.map((item) => (
								<span
									key={item.id}
									className="flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-1 text-sm text-foreground"
								>
									{item.label}
									<span
										role="button"
										tabIndex={0}
										onClick={(e) => {
											e.stopPropagation();
											selectClinicalRecordClick(item.id);
										}}
										className="cursor-pointer px-1"
									>
										×
									</span>
								</span>
							))}
						</div>
					)}
					<ArrowDownLine className="size-5 text-gray-400 shrink-0" />
				</PopoverTrigger>

				<PopoverContent sideOffset={8} className="flex flex-col gap-2 rounded-2xl p-2 ">
					{clinicalRecords.map((item) => (
						<MultiSelectItem
							key={item.id}
							selected={item.selected}
							handleClick={() => selectClinicalRecordClick(item.id)}
						>
							{item.label}
						</MultiSelectItem>
					))}
				</PopoverContent>
			</Popover>
		</div>
	);
}

function SendAs() {
	const [selectedFormat, setSelectedFormat] = useState<number | null>(null);

	const sendFileFormatClick = (index: number) => {
		setSelectedFormat(index);
	};
	return (
		<div className="mt-8 flex flex-col gap-3.5 items-start">
			<span className="text-gray-800 text-[1rem] block">Send as</span>

			<div className="flex gap-3 flex-wrap">
				{formats.map((format, index) => (
					<CheckButton
						key={index}
						selected={selectedFormat === index}
						handleClick={() => sendFileFormatClick(index)}
					>
						{format}
					</CheckButton>
				))}
			</div>
		</div>
	);
}

type ClinicalRecord = {
	id: string;
	label: string;
	selected: boolean;
};

const initialClinicalRecords: ClinicalRecord[] = [
	{
		id: crypto.randomUUID(),
		label: "Discharge Summaries",
		selected: false,
	},
	{
		id: crypto.randomUUID(),
		label: "Lab Reports",
		selected: false,
	},
	{
		id: crypto.randomUUID(),
		label: "Imaging",
		selected: false,
	},
	{
		id: crypto.randomUUID(),
		label: "Progress Notes",
		selected: false,
	},
	{
		id: crypto.randomUUID(),
		label: "Medication",
		selected: false,
	},
];

const formats = ["PDF", "Image", "Word"];

function MultiSelectItem({
	children,
	selected,
	handleClick,
}: {
	children: ReactNode;
	selected: boolean;
	handleClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={handleClick}
			className={cn(
				"flex w-full text-left items-center justify-between rounded-md px-3 h-11 text-sm",
				selected ? "bg-foreground/5 text-foreground" : "text-gray-600 hover:bg-gray-50",
			)}
		>
			<span>{children}</span>
			{selected && <Check className="size-4" />}
		</button>
	);
}

const CheckButton = ({
	children,
	selected,
	handleClick,
}: {
	children: ReactNode;
	selected: number | boolean;
	handleClick: () => void;
}) => {
	return (
		<button
			type="button"
			onClick={handleClick}
			className={cn(
				"px-[14px] py-2 border rounded-full text-gray-400 flex items-center gap-2 focus:outline-0 focus-visible:ring-ring/50 focus-visible:ring-[3px]",
				selected
					? "border-foreground text-foreground bg-foreground/5"
					: "border-gray-200 text-gray-500",
			)}
		>
			<span>{children}</span>
			{selected && <Check className="size-4" />}
		</button>
	);
};
