"use client";

import { Button } from "@/components/ui/button";
import EditLine from "@/icons/edit-line";
import MotionDiv from "@/lib/utils/motion-wrapper";
import { formatKey } from "@/lib/utils/format-key";
import { useParsedPatient } from "@/store/use-parsed-patient-store";
import { AnimatePresence } from "motion/react";
import { useState } from "react";

export default function ReviewInfoExtractClient() {
	const { patientData } = useParsedPatient();
	const dataArray = Object.entries(patientData ?? {});
	return (
		<div className="my-10 flex flex-col gap-3 items-start">
			{dataArray.map(([key, value]) => (
				<InfoExtractAccordion key={key} heading={key} subHeading={value} />
			))}
			<footer className="fixed bg-white bottom-0 right-0 left-0 py-8 border-t border-gray-200">
				<div className="max-w-[550px] mx-auto flex gap-4 px-6 xl:px-0">
					<Button variant="outline" className="flex-1 w-full">
						Cancel
					</Button>
					<Button className="flex-1 w-full">Save Patient Record</Button>
				</div>
			</footer>
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
