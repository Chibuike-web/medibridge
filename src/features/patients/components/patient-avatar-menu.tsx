"use client";

import { RiDeleteBin2Line, RiEdit2Line, RiUpload2Line } from "@remixicon/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils/get-initials";

export function PatientAvatarMenu({ patientName }: { patientName: string }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="relative h-auto rounded-none border-0 p-0 font-normal hover:bg-transparent hover:text-inherit focus-visible:border-0 [&_svg]:!size-3"
				>
					<Avatar className="size-16 border border-gray-200 bg-gray-100 text-gray-700">
						<AvatarFallback className="bg-gray-100 text-lg font-semibold text-gray-700">
							{getInitials(patientName ?? "")}
						</AvatarFallback>
					</Avatar>
					<div className="absolute right-[3px] bottom-[3px] size-4.5 border border-white/20 text-white bg-gray-800 flex items-center justify-center rounded-full ring ring-gray-800">
						<RiEdit2Line className="size-3" />
					</div>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				sideOffset={16}
				className="w-50 rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
			>
				<DropdownMenuItem className="rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
					<RiUpload2Line className="text-white" />
					<span>Upload image</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
					<RiDeleteBin2Line className="text-white" />
					<span>Remove image</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
