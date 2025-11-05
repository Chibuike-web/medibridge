"uec client";

import { Button } from "@/components/ui/button";
import {
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import CloseLine from "@/icons/close-line";
import { cn } from "@/lib/utils/cn";
import { Activity, ReactNode, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { formats, initialClinicalRecords, initialSteps, patients, type Step } from "./data";
import CheckCircle from "@/icons/check-circle";
import { Label } from "@/components/ui/label";
import ErrorWarningLine from "@/icons/error-warning-line";
import Check from "@/icons/check";

export default function PatientTransferModal() {
	const [currentStep, setCurrentStep] = useState(0);
	const [steps, setSteps] = useState<Step[]>(initialSteps);

	const updateStepStatus = (index: number) => {
		setSteps((prev) =>
			prev.map((step, i) => {
				if (i < index) return { ...step, status: "completed" };
				if (i === index) return { ...step, status: "current" };
				return { ...step, status: "upcoming" };
			})
		);
	};

	const handleNext = () => {
		const nextStep = Math.min(currentStep + 1, steps.length - 1);
		setCurrentStep(nextStep);
		updateStepStatus(nextStep);
	};

	const handleBack = () => {
		const prevStep = Math.max(currentStep - 1, 0);
		setCurrentStep(prevStep);
		updateStepStatus(prevStep);
	};

	return (
		<DialogContent>
			<DialogHeader className="flex flex-row justify-between items-center border-b p-6">
				<DialogTitle className="text-[clamp(18px,5vw,24px)] font-semibold">
					New Transfer Request
				</DialogTitle>
				<DialogClose>
					<CloseLine className="size-8" />
					<span className="sr-only">Close</span>
				</DialogClose>
			</DialogHeader>
			<Stepper steps={steps} />
			<div className="px-6 mb-6">
				<Activity mode={currentStep === 0 ? "visible" : "hidden"}>
					<StepOne />
				</Activity>
				<Activity mode={currentStep === 1 ? "visible" : "hidden"}>
					<StepTwo />
				</Activity>
				<Activity mode={currentStep === 2 ? "visible" : "hidden"}>
					<StepThree />
				</Activity>
				<Activity mode={currentStep === 3 ? "visible" : "hidden"}>
					<div>Step 4</div>
				</Activity>
			</div>
			<DialogFooter className="border-t">
				<Button
					variant="outline"
					className="h-11 cursor-pointer"
					disabled={currentStep === 0}
					onClick={handleBack}
				>
					Back
				</Button>
				<Button className="h-11 cursor-pointer" onClick={handleNext}>
					Next
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}

const Stepper = ({ steps }: { steps: Step[] }) => {
	return (
		<div className="px-6 my-10 flex items-start justify-between w-full">
			{steps.map((step, index) => (
				<Fragment key={step.label}>
					<BreadCrumbs label={step.label} status={step.status} />
					{index < steps.length - 1 && (
						<span className="w-[88px] h-[2px] block bg-gray-400 rounded-full mt-[11px]" />
					)}
				</Fragment>
			))}
		</div>
	);
};

const BreadCrumbs = ({ label, status }: { label: string; status: string }) => {
	const getCircleStyle = () => {
		switch (status) {
			case "completed":
				return "bg-gray-800";
			case "current":
				return "bg-gray-800";
			default:
				return "";
		}
	};
	const getTextStyle = () => {
		switch (status) {
			case "completed":
				return "text-gray-800";
			case "current":
				return "text-gray-800";
			default:
				return "text-gray-400";
		}
	};

	const getBorderStyle = () => {
		switch (status) {
			case "completed":
				return "border-gray-800";
			case "current":
				return "border-gray-800";
			default:
				return "border-gray-400";
		}
	};

	return (
		<div className="flex flex-col items-center w-full max-w-[40px] justify-center gap-[6px]">
			{status === "completed" ? (
				<CheckCircle className="size-6" />
			) : (
				<div
					className={cn(
						"size-6 rounded-full border flex items-center justify-center",
						getBorderStyle()
					)}
				>
					<span className={cn("size-4 inline-block rounded-full", getCircleStyle())} />
				</div>
			)}
			<p className={cn("text-[10px] text-center leading-[1.2em]", getTextStyle())}>{label}</p>
		</div>
	);
};

const StepOne = () => {
	return (
		<Select>
			<SelectGroup className="w-full">
				<SelectLabel className="text-gray-800 text-[1rem]">Select Patient</SelectLabel>
				<SelectTrigger className="w-full h-11 px-4">
					<SelectValue placeholder="Select patient" className="text-[16px]" />
				</SelectTrigger>
				<SelectContent className="rounded-[16px] h-[300px]" align="center">
					<div className="p-[6px]">
						<Input
							className="h-10 mb-3 placeholder:text-[16px]"
							type="search"
							placeholder="Search by name, MRN, or date of birth"
						/>

						{patients.map((p) => (
							<SelectItem
								key={p.hospitalId + p.name}
								value={`${p.hospitalId}-${p.name}`}
								className="h-11 px-4 rounded-[8px] text-[16px] focus:bg-gray-200"
							>
								<div className="flex items-center gap-[12px]">
									<span className="font-medium text-[16px]">{p.name}</span>
									<span className="p-[4px] rounded-[4px] bg-white text-[12px] border border-gray-200 leading-[1.2em]">
										{p.hospitalId}
									</span>
									<span className="p-[4px] rounded-[4px] bg-white text-[12px] border border-gray-200 leading-[1.2em]">
										{p.dob}
									</span>
								</div>
							</SelectItem>
						))}
					</div>
				</SelectContent>
			</SelectGroup>
		</Select>
	);
};

const StepTwo = () => {
	return (
		<form aria-describedby="info">
			<div className="mb-5">
				<Label htmlFor="targetHospitalName" className="block mb-2">
					Target Hospital Name
				</Label>
				<Input
					type="text"
					id="targetHospitalName"
					placeholder="e.g., Enugu State Teaching Hospital"
					className="h-11 mt-1"
					required
				/>
			</div>

			<div>
				<Label htmlFor="targetHospitalAdminEmail" className="block mb-2">
					Target Hospital Admin Email
				</Label>
				<Input
					type="email"
					id="targetHospitalAdminEmail"
					placeholder="e.g., admin@enuguhospital.gov.ng"
					className="h-11 mt-1"
					required
				/>
				<div className="text-[14px] flex gap-1 items-center mt-1 text-gray-400">
					<span aria-hidden>
						<ErrorWarningLine className="size-4" />
					</span>
					<p id="primary-contact-email-info">Must be official verified hospital email</p>
				</div>
			</div>
			<p className="text-gray-400 mt-5 text-[14px]" id="info">
				A secure transfer package will be sent to this hospital once the patient approves the
				request.
			</p>
		</form>
	);
};

const StepThree = () => {
	const [clinicalRecords, setClinicalRecords] = useState(initialClinicalRecords);
	const [selectedFormat, setSelectedFormat] = useState<number | null>(null);

	const handleFileFormatClick = (index: number) => {
		setSelectedFormat(index);
	};

	const handleClinicalRecordClick = (id: string) => {
		setClinicalRecords(
			clinicalRecords.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
		);
	};
	return (
		<>
			<div className="mb-6">
				<p>Attach Clinical Records</p>
				<div className="flex gap-[12px] flex-wrap mt-[12px]">
					{clinicalRecords.map((item) => (
						<CheckButton
							key={item.id}
							selected={item.selected}
							handleClick={() => handleClinicalRecordClick(item.id)}
						>
							{item.label}
						</CheckButton>
					))}
				</div>
			</div>
			<div className="mb-6">
				<p>Send as</p>
				<div className="flex gap-[12px] flex-wrap mt-[12px]">
					{formats.map((format, index) => (
						<CheckButton
							key={index}
							selected={selectedFormat === index}
							handleClick={() => handleFileFormatClick(index)}
						>
							{format}
						</CheckButton>
					))}
				</div>
			</div>

			<div>
				<Label htmlFor="notes" className="text-[16px] font-normal mb-2">
					Notes (Optional)
				</Label>
				<textarea
					placeholder="add context or special instructions"
					id="notes"
					className="w-full border border-gray-200 px-4 py-3 focus:outline-none focus-within:ring-3 focus-within:ring-foreground/15 focus-within:border-foreground/35 rounded-[8px]"
				></textarea>
			</div>
		</>
	);
};

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
				"px-[14] py-[8px] border rounded-full text-gray-400 flex items-center gap-2",
				selected
					? "border-foreground text-foreground bg-foreground/5"
					: "border-gray-200 text-gray-500 hover:border-gray-300"
			)}
		>
			<span>{children}</span>
			{selected && <Check className="size-4" />}
		</button>
	);
};
