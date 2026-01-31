"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { ReactNode } from "react";

export function SuccessModal({
	isOpen,
	setIsOpen,
	heading,
	description,
	children,
}: {
	isOpen: boolean;
	setIsOpen: (value: boolean) => void;
	heading: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
			<DialogContent>
				<div className="flex flex-col gap-6 items-center py-16 px-12">
					<Image src="/assets/success-icon.svg" width={160} height={160} alt="" />
					<div className="flex flex-col items-center gap-4">
						<DialogTitle className="text-[clamp(18px,5vw,24px)] font-semibold">
							{heading}
						</DialogTitle>
						<DialogDescription className="text-center">{description}</DialogDescription>
					</div>
				</div>
				{children}
			</DialogContent>
		</Dialog>
	);
}
