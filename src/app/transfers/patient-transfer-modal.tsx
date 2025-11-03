"uec client";

import { Button } from "@/components/ui/button";
import {
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import CloseLine from "@/icons/close-line";
import { cn } from "@/lib/utils/cn";
import { Fragment } from "react/jsx-runtime";

export default function PatientTransferModal() {
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
			<DialogFooter>
				<Button variant="outline" className="h-11 cursor-pointer">
					Cancel
				</Button>
				<Button className="h-11 cursor-pointer">Next</Button>
			</DialogFooter>
		</DialogContent>
	);
}

const steps = [
	{ label: "Patient Selection", status: "current" },
	{ label: "Hospital Info", status: "upcoming" },
	{ label: "Attach Records", status: "upcoming" },
	{ label: "Review & Send", status: "upcoming" },
];

const BreadCrumbs = ({ label, status }: { label: string; status: string }) => {
	const getCircleStyle = () => {
		switch (status) {
			case "completed":
				return "bg-gray-800";
			case "current":
				return "bg-blue-600";
			default:
				return "";
		}
	};
	const getTextStyle = () => {
		switch (status) {
			case "completed":
				return "text-gray-800";
			case "current":
				return "text-blue-600";
			default:
				return "text-gray-400";
		}
	};

	const getBorderStyle = () => {
		switch (status) {
			case "completed":
				return "border-gray-800";
			case "current":
				return "border-blue-600";
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
