"use client";

import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserProfile } from "@/components/layout/user-profile";
import {
	RiFileListFill,
	RiFileListLine,
	RiFileTransferFill,
	RiFileTransferLine,
	RiFunctionFill,
	RiFunctionLine,
	RiSearchLine,
} from "@remixicon/react";

export function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="flex flex-col w-full max-w-[17rem] h-full overflow-y-auto border-r border-gray-200">
			<div className="px-5 h-16 flex items-center">
				<h1 className="font-bold text-xl tracking-[-0.02em]">MediBridge</h1>
			</div>

			<ul className="flex flex-col gap-px p-2 text-[14px]">
				<li className="px-3 flex items-center gap-2 w-full h-9 cursor-pointer hover:bg-gray-200 rounded-lg">
					<RiSearchLine className="size-5" aria-hidden />
					<p>Search... </p>
				</li>
				{menus.map(({ id, href, text }) => {
					const isActive = pathname === href;

					return (
						<li
							key={id}
							className={cn("rounded-lg hover:bg-gray-200 font-medium", isActive && "bg-gray-200")}
						>
							<Link
								href={href}
								className={cn("px-3 rounded-lg flex items-center gap-2 w-full h-9")}
							>
								<span>
									{id === "overview" ? (
										isActive ? (
											<RiFunctionFill className="size-5" />
										) : (
											<RiFunctionLine className="size-5" />
										)
									) : id === "patients-records" ? (
										isActive ? (
											<RiFileListFill className="size-5" />
										) : (
											<RiFileListLine className="size-5" />
										)
									) : id === "transfers" ? (
										isActive ? (
											<RiFileTransferFill className="size-5" />
										) : (
											<RiFileTransferLine className="size-5" />
										)
									) : null}
								</span>
								<span>{text}</span>
							</Link>
						</li>
					);
				})}
			</ul>

			<UserProfile />
		</aside>
	);
}

const menus = [
	{ id: "overview", text: "Overview", href: "/dashboard/overview" },
	{ id: "patients-records", text: "Patients Records", href: "/dashboard/patients-records" },
	{ id: "transfers", text: "Transfers", href: "/dashboard/transfers" },
] as const;
