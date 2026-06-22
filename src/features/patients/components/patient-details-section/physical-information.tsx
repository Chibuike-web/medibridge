"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { RiEditLine, RiMore2Fill, RiShare2Line, RiCloseLine } from "@remixicon/react";

import { useState } from "react";
import { DetailItem, DetailsSection } from "./detail-fields";

type PhysicalInformationItem = {
	label: string;
	value: string | number;
};

export function PhysicalInformation({
	physicalInformation,
}: {
	physicalInformation: PhysicalInformationItem[];
}) {
	const [open, setOpen] = useState(false);

	const action = (
		<DropdownMenu>
					<DropdownMenuTrigger
						type="button"
						className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
						aria-label="Open actions for Personal Information"
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
							<RiShare2Line className="text-white" />
							<span>Export info</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
	);

	return (
		<>
			<DetailsSection title="Physical Information" action={action}>
				{physicalInformation.map((item) => (
					<DetailItem key={item.label} label={item.label} value={item.value} />
				))}
			</DetailsSection>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-[50rem]">
					<DialogHeader className="h-16 px-6 border-b border-gray-200">
						<DialogTitle>Edit Physical Information</DialogTitle>
						<DialogDescription className="sr-only">
							Form for editing physical information such as height, weight, blood group, and
							genotype.
						</DialogDescription>
						<DialogClose>
							<RiCloseLine className="size-6" />
						</DialogClose>
					</DialogHeader>

					<form className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-x-4 gap-y-6 px-6 pt-6 text-sm text-gray-800">
						<div className="flex flex-col gap-2">
							<Label>Height</Label>
							<Input placeholder="e.g. 172 cm" type="number" className="h-9" />
						</div>

						<div className="flex flex-col gap-2">
							<Label>Weight</Label>
							<Input placeholder="e.g. 68 kg" type="number" className="h-9" />
						</div>

						<div className="flex flex-col gap-2">
							<Label>Blood</Label>
							<Select>
								<SelectTrigger className="h-9 w-full">
									<SelectValue placeholder="Select blood group" />
								</SelectTrigger>
								<SelectContent className="p-1 rounded-[0.625rem]">
									<SelectGroup>
										<SelectItem value="A+">A+</SelectItem>
										<SelectItem value="A-">A-</SelectItem>
										<SelectItem value="B+">B+</SelectItem>
										<SelectItem value="B-">B-</SelectItem>
										<SelectItem value="AB+">AB+</SelectItem>
										<SelectItem value="AB-">AB-</SelectItem>
										<SelectItem value="O+">O+</SelectItem>
										<SelectItem value="O-">O-</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label>Genotype</Label>
							<Select>
								<SelectTrigger className="h-9 w-full">
									<SelectValue placeholder="Select genotype" />
								</SelectTrigger>
								<SelectContent className="p-1 rounded-[0.625rem]">
									<SelectGroup>
										<SelectItem value="AA">AA</SelectItem>
										<SelectItem value="AS">AS</SelectItem>
										<SelectItem value="SS">SS</SelectItem>
										<SelectItem value="AC">AC</SelectItem>
										<SelectItem value="SC">SC</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					</form>

					<DialogFooter className="mt-16 border-t border-gray-200 text-sm">
						<div className="flex gap-4 ml-auto">
							<DialogClose asChild>
								<Button variant="outline" className="h-10">
									Cancel
								</Button>
							</DialogClose>
							<Button className="h-10">Save</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

