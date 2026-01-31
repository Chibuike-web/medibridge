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
import { ArrowDownLine } from "@/icons/arrow-down-line";
import { Check } from "@/icons/check";
import { cn } from "@/lib/utils/cn";
import { ReactNode, useRef, useState } from "react";
import { SearchLine } from "@/icons/search-line";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { CloseLine } from "@/icons/close-line";
import { DialogClose } from "@radix-ui/react-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { SuccessModal } from "@/components/success-modal";
import { useShowSuccess } from "@/hooks/use-show-success";
import { useRouter } from "next/navigation";

export default function NewTransferRequestClient() {
	const { showSuccess, setShowSuccess } = useShowSuccess();
	const router = useRouter();
	return (
		<>
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
				<Dialog>
					<DialogTrigger asChild>
						<Button className="h-11 w-full mt-16" type="button">
							Send for Patient Approval
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader className="h-16 px-6 border-b border-gray-200">
							<DialogTitle className="text-[20px] font-semibold">
								Confirm Transfer Request
							</DialogTitle>
							<DialogClose>
								<CloseLine className="size-6" />
							</DialogClose>
						</DialogHeader>
						<div className="mt-8 px-6">
							<p className="text-gray-600 font-medium">
								Before this transfer request is sent, please review and confirm the following:
							</p>
							<ul className="mt-6 mb-8 text-gray-600 flex flex-col gap-4">
								<li className="flex items-center gap-2">
									<span aria-hidden>
										<Check className="size-5" />
									</span>
									<span>The correct patient is selected</span>
								</li>
								<li className="flex items-center gap-2">
									<span aria-hidden>
										<Check className="size-5" />
									</span>
									<span>The correct patient is selected</span>
								</li>
								<li className="flex items-center gap-2">
									<span aria-hidden>
										<Check className="size-5" />
									</span>
									<span>The correct patient is selected</span>
								</li>
							</ul>
							<Label className="flex items-center gap-4 px-5 py-3.5 rounded-[8px] bg-gray-50">
								<Checkbox />
								<div className="text-sm leading-[1.4em] font-normal">
									I have reviewed the patient details, selected records, and target hospital
									information. Everything is accurate and ready to proceed.
								</div>
							</Label>
						</div>
						<DialogFooter className="mt-16 border-t border-gray-200">
							<div className="flex gap-4 ml-auto">
								<Button
									variant="outline"
									className="h-11"
									onClick={() => router.push("/dashboard/transfers")}
								>
									Cancel
								</Button>
								<Button
									className="h-11"
									onClick={() => router.push("/dashboard/new-transfer-request")}
								>
									Continue
								</Button>
							</div>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</form>

			{showSuccess && (
				<SuccessModal
					isOpen={showSuccess}
					setIsOpen={setShowSuccess}
					heading="Transfer Request Sent"
					description="Your transfer request has been successfully submitted. 
The patient will review and approve this transfer before it is sent to the target hospital. You can track the status of this request in the Transfers section."
				>
					<DialogFooter className="border-t border-gray-200">
						<Button variant="outline" className="h-11">
							Return to Dashboard
						</Button>
						<Button className="h-11">Create another request</Button>
					</DialogFooter>
				</SuccessModal>
			)}
		</>
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
					className="flex h-[44px] items-center justify-between gap-4 w-full border border-input px-4 py-2 text-left outline-0 rounded-md focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
				>
					{selectedRecords.length === 0 ? (
						<div className="text-gray-500 whitespace-nowrap overflow-hidden gap-2 ">
							<span className="w-full shrink-0">Select patient records</span>
						</div>
					) : (
						<div className="flex gap-1.5 items-center text-sm text-foreground">
							<span className="flex items-center">{selectedRecords[0].label}</span>
							{selectedRecords.length - 1 > 0 && <span> +{selectedRecords.length - 1} more</span>}
						</div>
					)}
					<ArrowDownLine className="size-5 text-gray-400 shrink-0" />
				</PopoverTrigger>

				<PopoverContent sideOffset={8} className="flex flex-col gap-2 rounded-2xl p-2 ">
					{clinicalRecords.map((item) => (
						<MultiSelectItem
							key={item.id}
							selected={item.selected}
							onClick={() => selectClinicalRecordClick(item.id)}
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
						onClick={() => sendFileFormatClick(index)}
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
	onClick,
}: {
	children: ReactNode;
	selected: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
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
	onClick,
}: {
	children: ReactNode;
	selected: number | boolean;
	onClick: () => void;
}) => {
	return (
		<button
			type="button"
			onClick={onClick}
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
