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
				<div className="flex flex-col gap-6 items-center py-12 px-12">
					<Image src="/assets/success-icon.svg" width={120} height={120} alt="" />
					<div className="flex flex-col items-center gap-3">
						<DialogTitle className="text-lg">{heading}</DialogTitle>
						<DialogDescription className="text-center text-sm">{description}</DialogDescription>
					</div>
				</div>
				{children}
			</DialogContent>
		</Dialog>
	);
}
