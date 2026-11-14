"use client";

import { RiDeleteBinLine, RiUpload2Line } from "@remixicon/react";
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
					className="h-auto rounded-full border-0 p-0 font-normal hover:bg-transparent hover:text-inherit focus-visible:border-0"
				>
					<Avatar className="size-16 border border-gray-200 bg-gray-100 text-gray-700">
						<AvatarFallback className="bg-gray-100 text-lg font-semibold text-gray-700">
							{getInitials(patientName ?? "")}
						</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="rounded-xl bg-white text-sm text-gray-700">
				<DropdownMenuItem className="rounded-lg">
					<RiUpload2Line />
					<span>Upload image</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="rounded-lg text-rose-600 focus:bg-rose-50 focus:text-rose-600">
					<RiDeleteBinLine className="text-current" />
					<span>Remove image</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
