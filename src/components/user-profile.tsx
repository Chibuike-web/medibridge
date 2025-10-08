"use client";

import userProfileImage from "@/assets/user-profile/user-profile-image.png";
import ExpandUpDownLine from "@/icons/expand-up-down-line";
import Image from "next/image";

export default function UserProfile() {
	return (
		<button className="flex p-[28px] justify-between items-center w-full mt-auto">
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
	);
}
