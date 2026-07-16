"use client";

import { cn } from "@/lib/utils/cn";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTransition } from "react";
import { authClient } from "@/lib/better-auth/auth.client";
import {
	RiExpandUpDownLine,
	RiLoaderLine,
	RiLogoutBoxLine,
	RiVerifiedBadgeLine,
} from "@remixicon/react";

export function UserProfile({ isCollapsed }: { isCollapsed: boolean }) {
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

	return (
		<div className="w-full mt-auto p-2 flex justify-center">
			<DropdownMenu>
				<DropdownMenuTrigger
					className={cn(
						"flex w-full min-w-0 items-center rounded-lg p-3",
						isCollapsed
							? "justify-center"
							: "gap-2 cursor-pointer overflow-hidden hover:bg-gray-200",
					)}
				>
					<Avatar>
						<AvatarImage src={dummyUser.image} alt="profile image" />
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>

					{!isCollapsed ? (
						<div className="flex min-w-0 items-center w-full justify-between">
							<div className="flex min-w-0 flex-1 flex-col items-start">
								<span className="w-full truncate text-left text-sm font-medium">
									{dummyUser.name}
								</span>
								<span className="text-xs text-foreground/60 text-left truncate w-full">
									{dummyUser.email}
								</span>
							</div>

							<RiExpandUpDownLine className="size-4 shrink-0" />
						</div>
					) : null}
				</DropdownMenuTrigger>
				<DropdownMenuContent
					className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
					align="end"
					sideOffset={4}
				>
					<DropdownMenuLabel className="p-0 font-normal">
						<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
							<Avatar className="h-8 w-8">
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
						<DropdownMenuItem className="py-2">
							<RiVerifiedBadgeLine className="size-4" />
							Account
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => {
							startTransition(async () => {
								try {
									await authClient.signOut();
									window.location.replace("/sign-in");
								} catch (error) {
									console.error(error);
								}
							});
						}}
						className="py-2"
					>
						<RiLogoutBoxLine />
						Log out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{isPending && (
				<div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm grid place-items-center">
					<div className="flex flex-col gap-2 items-center">
						<RiLoaderLine className="size-6 animate-spin" />
						<span className="text-sm">Signing out...</span>
					</div>
				</div>
			)}
		</div>
	);
}
