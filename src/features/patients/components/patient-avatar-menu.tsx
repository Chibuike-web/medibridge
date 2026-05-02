"use client";

import { RiDeleteBin2Line, RiEdit2Line, RiUpload2Line } from "@remixicon/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/get-initials";

export function PatientAvatarMenu({ patientName }: { patientName: string }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="relative">
					<Avatar className="size-16 border border-gray-200 bg-gray-100 text-gray-700 relative">
						<AvatarFallback className="bg-gray-100 text-2xl font-semibold text-gray-700">
							{getInitials(patientName ?? "")}
						</AvatarFallback>
					</Avatar>
					<div className="absolute right-0 bottom-0 size-[18px] border border-white/20 text-white bg-gray-800 flex items-center justify-center rounded-full ring ring-gray-800">
						<RiEdit2Line className="size-[12px]" />
					</div>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				sideOffset={16}
				className="w-[13.75rem] rounded-xl border border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
			>
				<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white">
					<RiUpload2Line className="text-white" />
					<span>Upload image</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white">
					<RiDeleteBin2Line className="text-white" />
					<span>Remove image</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
