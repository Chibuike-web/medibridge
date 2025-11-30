"use client";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Button } from "./ui/button";

export default function SuccessModal({
	isOpen,
	onClick,
	heading,
	description,
	buttonText,
}: {
	isOpen: boolean;
	onClick: () => void;
	heading: string;
	description: string;
	buttonText: string;
}) {
	return (
		<Dialog open={isOpen}>
			<DialogContent>
				<div className="flex flex-col gap-12 items-center px-6 py-6">
					<Image src="/assets/success-icon.svg" width={160} height={160} alt="" />
					<div className="flex flex-col items-center gap-5">
						<DialogTitle className="text-[clamp(18px,5vw,24px)] font-semibold">
							{heading}
						</DialogTitle>
						<DialogDescription className="text-[20px] text-center">{description}</DialogDescription>
					</div>
				</div>
				<DialogFooter className="border-t border-gray-200 w-full">
					<Button className="h-11 w-full cursor-pointer" onClick={onClick}>
						{buttonText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
