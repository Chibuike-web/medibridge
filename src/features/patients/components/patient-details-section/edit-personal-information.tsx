"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	RiCalendarLine,
	RiCloseLine,
	RiEditLine,
	RiMore2Fill,
	RiShareForwardBoxLine,
} from "@remixicon/react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function EditPersonalInformation() {
	const [open, setOpen] = useState(false);
	const [dob, setDob] = useState<Date | undefined>();

	return (
		<section className="rounded-xl bg-gray-50 ring ring-gray-200">
			<div className="flex h-11 items-center justify-between gap-4 px-4">
				<h2 className="font-semibold text-lg text-gray-600 no-line-height">Personal Information</h2>
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
							className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white"
						>
							<RiEditLine className="text-white" />
							<span>Edit info</span>
						</DropdownMenuItem>

						<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white">
							<RiShareForwardBoxLine className="text-white" />
							<span>Export info</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 rounded-xl bg-white p-4 ring ring-gray-200">
				{personalInformation.map((item) => (
					<div key={item.label} className="flex w-full flex-col gap-4">
						<div className="text-sm font-normal text-gray-400 no-line-height">{item.label}</div>
						<div className="text-sm font-semibold text-gray-600 no-line-height">{item.value}</div>
					</div>
				))}
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-[800px]">
					<DialogHeader className="h-16 px-6 border-b border-gray-200">
						<DialogTitle>Edit Personal Information</DialogTitle>
						<DialogDescription className="sr-only">
							Form for editing personal information such as name, age, sex, and marital status.
						</DialogDescription>
						<DialogClose>
							<RiCloseLine className="size-6" />
						</DialogClose>
					</DialogHeader>

					<form className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-x-4 gap-y-6 px-6 pt-6 text-gray-800">
						<div className="flex flex-col gap-2">
							<Label>First name</Label>
							<Input id="firstName" placeholder="Enter First name" type="text" className="h-11" />
						</div>
						<div className="flex flex-col gap-2">
							<Label>Middle name</Label>
							<Input id="middleName" placeholder="Enter Middle name" type="text" className="h-11" />
						</div>
						<div className="flex flex-col gap-2">
							<Label>Last name</Label>
							<Input id="lastName" placeholder="Enter Last name" type="text" className="h-11" />
						</div>
						<div className="flex flex-col gap-2">
							<Label>Age</Label>
							<Input id="age" placeholder="Eg, 24, 32" type="number" className="h-11" />
						</div>
						<div className="flex flex-col gap-2">
							<Label>Date of Birth</Label>

							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										data-empty={!dob}
										className="h-11 w-full flex items-center justify-between font-normal data-[empty=true]:text-muted-foreground active:scale-100 hover:bg-transparent"
									>
										{dob ? format(dob, "PPP") : <span>Select date</span>}
										<RiCalendarLine className="size-5 text-gray-600" />
									</Button>
								</PopoverTrigger>

								<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
									<Calendar mode="single" selected={dob} onSelect={setDob} autoFocus />
								</PopoverContent>
							</Popover>
						</div>

						<div className="flex flex-col gap-2">
							<Label>Sex</Label>

							<Select>
								<SelectTrigger className="h-11 w-full">
									<SelectValue placeholder="Select sex" />
								</SelectTrigger>
								<SelectContent className="p-1 rounded-[10px]">
									<SelectGroup>
										<SelectItem value="male">Male</SelectItem>
										<SelectItem value="female">Female</SelectItem>
										<SelectItem value="other">Other</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2">
							<Label>Marital Status</Label>

							<Select>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select marital status" />
								</SelectTrigger>

								<SelectContent className="p-1 rounded-[10px]">
									<SelectGroup>
										<SelectItem value="single">Single</SelectItem>
										<SelectItem value="married">Married</SelectItem>
										<SelectItem value="divorced">Divorced</SelectItem>
										<SelectItem value="widowed">Widowed</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label>National ID</Label>
							<Input
								id="lastName"
								placeholder="Enter National ID Number"
								type="text"
								className="h-11"
							/>
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
		</section>
	);
}

const personalInformation = [
	{ label: "First name", value: "Timothy" },
	{ label: "Middle name", value: "Chibuike" },
	{ label: "Last name", value: "Maduabuchi" },
	{ label: "Patient ID", value: "1234567890" },
	{ label: "Age", value: "100" },
	{ label: "Date Of Birth", value: "10-02-1926" },
	{ label: "Sex", value: "Male" },
	{ label: "Marital Status", value: "Single" },
	{ label: "National ID", value: "1234567890" },
];
