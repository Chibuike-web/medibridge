"use client";

import { Button } from "@/components/ui/button";
import EditLine from "@/icons/edit-line";
import MotionDiv from "@/lib/utils/motion-wrapper";
import { formatKey } from "@/lib/utils/format-key";
import { useParsedPatient } from "@/store/use-parsed-patient-store";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

export default function ReviewInfoExtractClient() {
	const { patientData } = useParsedPatient();
	const router = useRouter();
	const dataArray = Object.entries(patientData ?? {});
	const [isOpen, setIsOpen] = useState(false);
	return (
		<div className="my-10 flex flex-col gap-3 items-start">
			{dataArray.map(([key, value]) => (
				<InfoExtractAccordion key={key} heading={key} subHeading={value} />
			))}
			<footer className="fixed bg-white bottom-0 right-0 left-0 py-8 border-t border-gray-200">
				<div className="max-w-[550px] mx-auto flex gap-4 px-6 xl:px-0">
					<Button
						variant="outline"
						className="flex-1 w-full"
						onClick={() => router.replace("/dashboard")}
					>
						Cancel
					</Button>
					<Button className="flex-1 w-full" onClick={() => setIsOpen(true)}>
						Save Patient Record
					</Button>
				</div>
			</footer>

			{isOpen && <SuccessModal isOpen={isOpen} setIsOpen={setIsOpen} />}
		</div>
	);
}

const InfoExtractAccordion = ({
	heading,
	subHeading,
}: {
	heading: string;
	subHeading: string | number;
}) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="w-full border p-4 rounded-[8px]">
			<button
				onClick={() => setIsOpen((prev) => !prev)}
				className="w-full flex"
				aria-expanded={isOpen}
				aria-controls={`accordion-${heading}`}
			>
				<h2>{formatKey(heading)}</h2>
			</button>

			<AnimatePresence>
				{isOpen && (
					<MotionDiv
						key={heading}
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.25, ease: "easeInOut" }}
						className="overflow-hidden"
					>
						<div
							id={`accordion-${heading}`}
							className="mt-2 text-sm w-full flex items-center justify-between text-gray-700"
						>
							{subHeading}
							<button
								className="ml-2 text-sm text-gray-600 flex items-end gap-2"
								onClick={(e) => {
									e.stopPropagation();
									console.log("Edit clicked for", heading);
								}}
							>
								<span>
									<EditLine className="size-[18px]" />
								</span>
								<span className="leading-3.5 block">Edit</span>
							</button>
						</div>
					</MotionDiv>
				)}
			</AnimatePresence>
		</div>
	);
};

const SuccessModal = ({
	isOpen,
	setIsOpen,
}: {
	isOpen: boolean;
	setIsOpen: (value: boolean) => void;
}) => {
	return (
		<Dialog open={isOpen}>
			<DialogContent>
				<div className="flex flex-col gap-12 items-center px-6 py-6">
					<Image src="/assets/success-icon.svg" width={160} height={160} alt="" />
					<div className="flex flex-col items-center gap-[20px]">
						<DialogTitle className="text-[clamp(18px,5vw,24px)] font-semibold">
							Patient Record Saved Successfully
						</DialogTitle>
						<DialogDescription className="text-[20px] text-center">
							The patient's information has been securely saved. You may now proceed with additional
							documentation or return to the dashboard.
						</DialogDescription>
					</div>
				</div>
				<DialogFooter className="border-t border-gray-200 w-full">
					<Button className="h-11 w-full cursor-pointer">Return to Dashboard</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
