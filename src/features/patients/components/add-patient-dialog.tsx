"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { RiCloseLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function AddPatientDialog({
	returnTo,
	open,
	onOpenChange,
	children,
}: {
	returnTo: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: ReactNode;
}) {
	const router = useRouter();
	const [selectedAddPatientRoute, setSelectedAddPatientRoute] = useState("");
	const query = `?returnTo=${encodeURIComponent(returnTo)}`;
	const options = [
		{
			title: "Enter manually",
			description: "Type in one patient’s details",
			href: `/dashboard/add-new-patient/manual${query}`,
		},
		{
			title: "Bulk upload",
			description: "Upload records and review the extracted details",
			href: `/dashboard/add-new-patient/bulk${query}`,
		},
	];

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) setSelectedAddPatientRoute("");
				onOpenChange?.(isOpen);
			}}
		>
			{children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add patient</DialogTitle>
					<DialogDescription className="sr-only">
						Choose how to add a patient record.
					</DialogDescription>
					<DialogClose asChild>
						<Button variant="ghost" size="icon" aria-label="Close add patient dialog">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DialogClose>
				</DialogHeader>
				<RadioGroup
					value={selectedAddPatientRoute}
					onValueChange={setSelectedAddPatientRoute}
					aria-label="How to add the patient"
					className="grid-cols-1 px-4 py-5 sm:grid-cols-2"
				>
					{options.map((option) => (
						<Label
							key={option.title}
							className="cursor-pointer items-start gap-3 rounded-[0.875rem] border border-gray-200 p-4 has-data-[state=checked]:border-gray-400 has-data-[state=checked]:ring-2 has-data-[state=checked]:ring-gray-200"
						>
							<RadioGroupItem value={option.href} className="mt-0.5" />
							<span className="flex min-w-0 flex-col gap-1.5 text-sm leading-[1.4] tracking-[-0.02em] text-gray-600">
								<span className="font-semibold">{option.title}</span>
								<span className="font-normal text-pretty">{option.description}</span>
							</span>
						</Label>
					))}
				</RadioGroup>
				<DialogFooter className="gap-3 sm:justify-end">
					<DialogClose asChild>
						<Button variant="outline">Cancel</Button>
					</DialogClose>
					<DialogClose asChild>
						<Button
							disabled={!selectedAddPatientRoute}
							onClick={() => router.push(selectedAddPatientRoute as Route)}
						>
							Continue
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
