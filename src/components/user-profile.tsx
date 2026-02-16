"use client";

import ExpandUpDownLine from "@/icons/expand-up-down-line";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { VerifiedBadgeLine } from "@/icons/verified-badge-line";
import { LogoutBoxLine } from "@/icons/logout-box-line";
import { useTransition } from "react";
import { authClient } from "@/lib/better-auth/auth.client";
import { useRouter } from "next/navigation";
import { LoaderLine } from "@/icons/loader-line";

export function UserProfile() {
	const dummyUser = {
		name: "John Doe",
		email: "john.doe@example.com",
		image: "https://api.dicebear.com/7.x/initials/svg?seed=John%20Doe",
	};

	const initials = dummyUser.name
		.split(" ")
		.map((namePart) => namePart.charAt(0).toUpperCase())
		.join("");

	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	return (
		<div className=" w-full mt-auto p-3">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button className="flex p-3 justify-between w-full items-center cursor-pointer hover:bg-gray-200 rounded-[8px]">
						<Avatar className="size-10 rounded-full">
							<AvatarImage src={dummyUser.image} alt="profile image" className="rounded-full" />
							<AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
						</Avatar>
						<div className="flex flex-col items-start w-[142px]">
							<p className="font-medium text-[14px] text-foreground">{dummyUser.name}</p>
							<p className="text-[12px] text-foreground/60 truncate w-full">{dummyUser.email}</p>
						</div>
						<span className="shrink-0">
							<ExpandUpDownLine className="size-5" />
						</span>
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
					align="end"
					sideOffset={4}
				>
					<DropdownMenuLabel className="p-0 font-normal">
						<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
							<Avatar className="h-8 w-8 rounded-full">
								<AvatarImage src={dummyUser.image} alt="profile image" className="rounded-full" />
								<AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{dummyUser.name}</span>
								<span className="truncate text-xs">{dummyUser.email}</span>
							</div>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem>
							<VerifiedBadgeLine className="size-4" />
							Account
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => {
							startTransition(async () => {
								try {
									await authClient.signOut();
									router.replace("/sign-in");
								} catch (error) {
									console.error(error);
								}
							});
						}}
					>
						<LogoutBoxLine />
						{isPending ? "Logging Out..." : "Log out"}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{isPending && (
				<div className="absolute inset-0 z-[100] bg-white grid place-items-center">
					<div className="flex flex-col gap-2 items-center">
						<LoaderLine className="size-6 animate-spin" />
						<span className="text-18px">Authenticating....</span>
					</div>
				</div>
			)}
		</div>
	);
}
