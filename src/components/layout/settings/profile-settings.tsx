"use client";

import {
	RiDeleteBin2Line,
	RiEdit2Line,
	RiUpload2Line,
} from "@remixicon/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils/get-initials";

import type { SettingsDialogUser } from "./types";

export function ProfileSettings({ user }: { user: SettingsDialogUser }) {
	return (
		<div className="flex h-full flex-col items-center gap-16 pt-6">
			<PatientAvatarMenu patientName={user.name} />
			<dl className="w-full px-6">
				<div className="flex h-16 items-center justify-between gap-4 border-b">
					<dt className="text-sm font-medium text-gray-600">
						<label htmlFor="settings-full-name">Full name</label>
					</dt>
					<dd>
						<input
							id="settings-full-name"
							name="fullName"
							type="text"
							defaultValue={user.name}
							className="rounded-md text-right text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
						/>
					</dd>
				</div>
				<div className="flex h-16 items-center justify-between gap-4 border-b opacity-50">
					<dt className="text-sm font-medium text-gray-600">Email</dt>
					<dd className="text-sm font-medium text-gray-600">{user.email}</dd>
				</div>
			</dl>
			<div className="mt-auto flex w-full shrink-0 gap-2 border-t p-5">
				<Button variant="outline" className="ml-auto">
					Cancel
				</Button>
				<Button>Save</Button>
			</div>
		</div>
	);
}

function PatientAvatarMenu({ patientName }: { patientName: string }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="relative w-max rounded-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-300"
					aria-label="Change profile photo"
				>
					<Avatar className="size-[146px] border border-gray-200 bg-gray-100 text-gray-700">
						<AvatarFallback className="bg-gray-100 text-4xl font-semibold text-gray-700">
							{getInitials(patientName ?? "")}
						</AvatarFallback>
					</Avatar>
					<div
						className="absolute right-[3px] bottom-[3px] flex size-9 items-center justify-center rounded-full border border-white/20 bg-gray-800 text-white ring ring-gray-800"
						aria-hidden="true"
					>
						<RiEdit2Line className="size-5" aria-hidden="true" />
					</div>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="center"
				sideOffset={12}
				className="w-[13.75rem] rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
			>
				<DropdownMenuItem className="gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white">
					<RiUpload2Line className="text-white" aria-hidden="true" />
					<span>Upload image</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white">
					<RiDeleteBin2Line className="text-white" aria-hidden="true" />
					<span>Remove image</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
