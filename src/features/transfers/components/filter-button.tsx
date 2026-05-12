"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

import { RiCalendarLine, RiFilter3Line, RiMenLine } from "@remixicon/react";

export function FilterButton() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					size="lg"
					variant="outline"
					className="gap-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"
				>
					<RiFilter3Line aria-hidden className="size-5 text-gray-600" />
					Filter
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="end"
				sideOffset={8}
				className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
			>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
						<RiMenLine className="size-[18px]" /> <span>Status</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						sideOffset={12}
						alignOffset={-5}
						className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900">
							Male
						</DropdownMenuItem>

						<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900">
							Female
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
						<RiCalendarLine className="size-[18px]" /> <span>Requested at</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						sideOffset={8}
						className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<DropdownMenuItem
							className="rounded-lg"
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<Label className="w-full">
								<Checkbox /> Pending
							</Label>
						</DropdownMenuItem>
						<DropdownMenuItem
							className="rounded-lg focus:bg-gray-100 focus:text-gray-900"
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<Label className="w-full">
								<Checkbox /> Rejected
							</Label>
						</DropdownMenuItem>
						<DropdownMenuItem
							className="rounded-lg focus:bg-gray-100 focus:text-gray-900"
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<Label className="w-full">
								<Checkbox /> Completed
							</Label>
						</DropdownMenuItem>
						<DropdownMenuItem
							className="rounded-lg focus:bg-gray-100 focus:text-gray-900"
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<Label className="w-full">
								<Checkbox /> Failed
							</Label>
						</DropdownMenuItem>
						<DropdownMenuItem
							className="rounded-lg focus:bg-gray-100 focus:text-gray-900"
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<Label className="w-full">
								<Checkbox /> Cancelled
							</Label>
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
