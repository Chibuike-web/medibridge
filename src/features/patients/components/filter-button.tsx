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
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 text-gray-600  data-[state=open]:bg-gray-100 py-2">
						<RiMenLine className="size-[18px]" />
						<span className="block">Gender</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						sideOffset={12}
						alignOffset={-5}
						className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<RadioGroup defaultValue="all" className="flex flex-col gap-0">
							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="all" id="all" />
								<Label htmlFor="all" className="cursor-pointer w-full leading-normal font-normal">
									All
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="male" id="male" />
								<Label htmlFor="male" className="cursor-pointer w-full leading-normal font-normal">
									Active
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="female" id="female" />
								<Label
									htmlFor="female"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									Female
								</Label>
							</div>
						</RadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
						<RiCalendarView className="size-[18px]" /> <span className="block">Age</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						sideOffset={8}
						alignOffset={-5}
						className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<RadioGroup defaultValue="any-age" className="flex flex-col gap-0">
							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="any-age" id="any-age" />
								<Label
									htmlFor="any-age"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									Any age
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="children" id="children" />
								<Label
									htmlFor="children"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									0-12 (Children)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="teenagers" id="teenagers" />
								<Label
									htmlFor="teenagers"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									13-17 (Teenagers)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="young-adults" id="young-adults" />
								<Label
									htmlFor="young-adults"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									18-35 (Young adults)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="adults" id="adults" />
								<Label
									htmlFor="adults"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									36-60 (Adults)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="seniors" id="seniors" />
								<Label
									htmlFor="seniors"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									60+ (Seniors)
								</Label>
							</div>
						</RadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
						<RiCalendarLine className="size-[18px]" /> <span className="block">Created at</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						sideOffset={8}
						alignOffset={-5}
						className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2">
							Today
						</DropdownMenuItem>

						<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2">
							This week
						</DropdownMenuItem>

						<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2">
							This month
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
