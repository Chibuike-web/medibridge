"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { RiCloseLine, RiEditLine, RiMore2Fill, RiShareForwardBoxLine } from "@remixicon/react";
import { DetailItem, DetailsSection } from "./detail-fields";

type ContactInformationItem = {
	label: string;
	value: string | number;
};

export function ContactInformation({
	contactInformation,
}: {
	contactInformation: ContactInformationItem[];
}) {
	const [open, setOpen] = useState(false);

	const action = (
		<DropdownMenu>
					<DropdownMenuTrigger
						type="button"
						className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
						aria-label="Open actions for Contact Information"
					>
						<RiMore2Fill className="size-5" aria-hidden />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-[13.75rem] rounded-xl border border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
					>
						<DropdownMenuItem
							onSelect={(e) => {
								e.preventDefault();
								setOpen(true);
							}}
							className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
						>
							<RiEditLine className="text-white" />
							<span>Edit info</span>
						</DropdownMenuItem>
						<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
							<RiShareForwardBoxLine className="text-white" />
							<span>Export info</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
	);

	return (
		<>
			<DetailsSection title="Contact Information" action={action}>
				{contactInformation.map((item) => (
					<DetailItem key={item.label} label={item.label} value={item.value} />
				))}
			</DetailsSection>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-[50rem]">
					<DialogHeader className="h-16 px-6 border-b border-gray-200">
						<DialogTitle>Edit Contact Information</DialogTitle>

						<DialogDescription className="sr-only">
							Form for editing contact details such as phone number, email, and address.
						</DialogDescription>

						<DialogClose>
							<RiCloseLine className="size-6" />
						</DialogClose>
					</DialogHeader>

					<form className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-x-4 gap-y-6 px-6 pt-6 text-gray-800">
						<div className="flex flex-col gap-2">
							<Label>Phone number</Label>
							<Input id="phone" placeholder="e.g. +234 801 234 5678" type="tel" className="h-11" />
						</div>

						<div className="flex flex-col gap-2">
							<Label>Email address</Label>
							<Input id="email" placeholder="e.g. chinenye.okafor@example.com" type="email" className="h-11" />
						</div>

						<div className="flex flex-col gap-2">
							<Label>Residential address</Label>
							<Input
								id="address"
								placeholder="e.g. 14 Hospital Road, Enugu"
								type="text"
								className="h-11"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label>State of Origin</Label>
							<Input id="state" placeholder="e.g. Enugu" type="text" className="h-11" />
						</div>

						<div className="flex flex-col gap-2">
							<Label>Country of Origin</Label>
							<Input id="country" placeholder="e.g. Nigeria" type="text" className="h-11" />
						</div>
					</form>

					<DialogFooter className="mt-16 border-t border-gray-200">
						<div className="flex gap-4 ml-auto">
							<DialogClose asChild>
								<Button variant="outline" className="h-11">
									Cancel
								</Button>
							</DialogClose>

							<Button className="h-11">Save</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

