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
import { useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { initialSteps, patients, type Step } from "./data";

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
				{currentStep === 0 && <StepOne />}
				{currentStep === 1 && <div>Step 2</div>}
				{currentStep === 2 && <div>Step 3</div>}
				{currentStep === 3 && <div>Review & Send</div>}
			</div>
			<DialogFooter className="border-t">
				<Button
					variant="outline"
					className="h-11 cursor-pointer"
					disabled={currentStep === 0}
					onClick={handleBack}
				>
					Cancel
				</Button>
				<Button
					className="h-11 cursor-pointer"
					onClick={handleNext}
					disabled={currentStep === steps.length - 1}
				>
					Next
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}

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
			<div
				className={cn(
					"size-6 rounded-full border flex items-center justify-center",
					getBorderStyle()
				)}
			>
				<span className={cn("size-4 inline-block rounded-full", getCircleStyle())} />
			</div>
			<p className={cn("text-[10px] text-center leading-[1.2em]", getTextStyle())}>{label}</p>
		</div>
	);
};
