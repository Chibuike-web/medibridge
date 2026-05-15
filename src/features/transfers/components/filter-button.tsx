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
				sideOffset={12}
				alignOffset={-5}
				className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
			>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
						<RiMenLine className="size-[18px]" /> <span>Status</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						sideOffset={8}
						alignOffset={-5}
						className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<DropdownMenuItem
							className="rounded-lg focus:bg-gray-100 focus:text-gray-900 h-8"
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<Label
								htmlFor="status-pending"
								className="flex w-full cursor-pointer items-center gap-2"
							>
								<Checkbox id="status-pending" className="[&_svg]:!text-current" />
								<span>Pending</span>
							</Label>
						</DropdownMenuItem>

						<DropdownMenuItem
							className="rounded-lg focus:bg-gray-100 focus:text-gray-900 h-8"
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<Label
								htmlFor="status-rejected"
								className="flex w-full cursor-pointer items-center gap-2"
							>
								<Checkbox id="status-rejected" className="[&_svg]:!text-current" />
								<span>Rejected</span>
							</Label>
						</DropdownMenuItem>

						<DropdownMenuItem
							className="rounded-lg focus:bg-gray-100 focus:text-gray-900 h-8"
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<Label
								htmlFor="status-completed"
								className="flex w-full cursor-pointer items-center gap-2"
							>
								<Checkbox id="status-completed" className="[&_svg]:!text-current" />
								<span>Completed</span>
							</Label>
						</DropdownMenuItem>

						<DropdownMenuItem
							className="rounded-lg focus:bg-gray-100 focus:text-gray-900 h-8"
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<Label
								htmlFor="status-failed"
								className="flex w-full cursor-pointer items-center gap-2"
							>
								<Checkbox id="status-failed" className="[&_svg]:!text-current" />
								<span>Failed</span>
							</Label>
						</DropdownMenuItem>

						<DropdownMenuItem
							className="rounded-lg focus:bg-gray-100 focus:text-gray-900 h-8"
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<Label
								htmlFor="status-cancelled"
								className="flex w-full cursor-pointer items-center gap-2"
							>
								<Checkbox id="status-cancelled" className="[&_svg]:!text-current" />
								<span>Cancelled</span>
							</Label>
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
						<RiCalendarLine className="size-[18px]" /> <span>Requested at</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						sideOffset={8}
						alignOffset={-5}
						className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<DropdownMenuItem
							className="rounded-lg focus:bg-gray-100 focus:text-gray-900 h-8"
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<Label
								htmlFor="requested-pending"
								className="flex w-full cursor-pointer items-center gap-2"
							>
								<Checkbox id="requested-pending" className="[&_svg]:!text-current" />
								<span>Pending</span>
							</Label>
						</DropdownMenuItem>

						<DropdownMenuItem
							className="rounded-lg focus:bg-gray-100 focus:text-gray-900 h-8"
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<Label
								htmlFor="requested-rejected"
								className="flex w-full cursor-pointer items-center gap-2"
							>
								<Checkbox id="requested-rejected" className="[&_svg]:!text-current" />
								<span>Rejected</span>
							</Label>
						</DropdownMenuItem>

						<DropdownMenuItem
							className="rounded-lg focus:bg-gray-100 focus:text-gray-900 h-8"
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<Label
								htmlFor="requested-completed"
								className="flex w-full cursor-pointer items-center gap-2"
							>
								<Checkbox id="requested-completed" className="[&_svg]:!text-current" />
								<span>Completed</span>
							</Label>
						</DropdownMenuItem>

						<DropdownMenuItem
							className="rounded-lg focus:bg-gray-100 focus:text-gray-900 h-8"
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<Label
								htmlFor="requested-failed"
								className="flex w-full cursor-pointer items-center gap-2"
							>
								<Checkbox id="requested-failed" className="[&_svg]:!text-current" />
								<span>Failed</span>
							</Label>
						</DropdownMenuItem>

						<DropdownMenuItem
							className="rounded-lg focus:bg-gray-100 focus:text-gray-900 h-8"
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<Label
								htmlFor="requested-cancelled"
								className="flex w-full cursor-pointer items-center gap-2"
							>
								<Checkbox id="requested-cancelled" className="[&_svg]:!text-current" />
								<span>Cancelled</span>
							</Label>
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
