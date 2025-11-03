"use client";

import userProfileImage from "@/assets/user-profile/user-profile-image.png";
import ExpandUpDownLine from "@/icons/expand-up-down-line";
import Image, { StaticImageData } from "next/image";
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
import SparklingLine from "@/icons/sparkling-line";
import VerifiedBadgeLine from "@/icons/verified-badge-line";
import BankCardLine from "@/icons/bank-card-line";
import LogoutBoxLine from "@/icons/logout-box-line";

export default function UserProfile() {
	return (
		<div className=" w-full mt-auto p-[12px]">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button className="flex p-[12px] justify-between w-full items-center cursor-pointer hover:bg-gray-200 rounded-[8px]">
						<Image
							src={userProfileImage}
							alt="profile image"
							width={40}
							height={40}
							className="size-10 rounded-full"
						/>
						<div className="flex flex-col items-start">
							<p className="font-medium text-[14px] text-foreground">Admin</p>
							<p className="text-[12px] text-foreground/60">obinnatc2018@gmail.com</p>
						</div>
						<span className="flex-shrink-0">
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
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage
									src={(userProfileImage as StaticImageData).src}
									alt="profile image"
									className="rounded-full"
								/>
								<AvatarFallback className="rounded-lg">CN</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">Admin</span>
								<span className="truncate text-xs">obinnatc2018@gmail.com</span>
							</div>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem>
							<SparklingLine className="size-4" />
							Upgrade to Pro
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem>
							<VerifiedBadgeLine className="size-4" />
							Account
						</DropdownMenuItem>
						<DropdownMenuItem>
							<BankCardLine className="size-4" />
							Billing
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuItem>
						<LogoutBoxLine />
						Log out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
