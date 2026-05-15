"use client";

import { Button } from "@/components/ui/button";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { RiCalendarLine, RiCalendarView, RiFilter3Line, RiMenLine } from "@remixicon/react";

export function FilterButton() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					size="lg"
					variant="outline"
					className="gap-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"
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
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 text-gray-600  data-[state=open]:bg-gray-100">
						<RiMenLine className="size-[18px]" />
						<span>Gender</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						sideOffset={12}
						alignOffset={-5}
						className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<RadioGroup defaultValue="all" className="flex flex-col gap-0">
							<div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 h-8">
								<RadioGroupItem value="all" id="all" />
								<Label htmlFor="all" className="cursor-pointer w-full">
									All
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 h-8">
								<RadioGroupItem value="male" id="male" />
								<Label htmlFor="male" className="cursor-pointer w-full">
									Active
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 h-8">
								<RadioGroupItem value="female" id="female" />
								<Label htmlFor="female" className="cursor-pointer w-full">
									Female
								</Label>
							</div>
						</RadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
						<RiCalendarView className="size-[18px]" /> <span>Age</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						sideOffset={8}
						alignOffset={-5}
						className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<RadioGroup defaultValue="any-age" className="flex flex-col gap-0">
							<div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 h-8">
								<RadioGroupItem value="any-age" id="any-age" />
								<Label htmlFor="any-age" className="w-full cursor-pointer">
									Any age
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 h-8">
								<RadioGroupItem value="children" id="children" />
								<Label htmlFor="children" className="w-full cursor-pointer">
									0-12 (Children)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 h-8">
								<RadioGroupItem value="teenagers" id="teenagers" />
								<Label htmlFor="teenagers" className="w-full cursor-pointer">
									13-17 (Teenagers)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 h-8">
								<RadioGroupItem value="young-adults" id="young-adults" />
								<Label htmlFor="young-adults" className="w-full cursor-pointer">
									18-35 (Young adults)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 h-8">
								<RadioGroupItem value="adults" id="adults" />
								<Label htmlFor="adults" className="w-full cursor-pointer">
									36-60 (Adults)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 h-8">
								<RadioGroupItem value="seniors" id="seniors" />
								<Label htmlFor="seniors" className="w-full cursor-pointer">
									60+ (Seniors)
								</Label>
							</div>
						</RadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
						<RiCalendarLine className="size-[18px]" /> <span>Created at</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						sideOffset={8}
						alignOffset={-5}
						className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900 h-8">
							Today
						</DropdownMenuItem>

						<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900 h-8">
							This week
						</DropdownMenuItem>

						<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900 h-8">
							This month
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
