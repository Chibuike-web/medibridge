"use client";

import FileListFill from "@/icons/file-list-fill";
import FileListLine from "@/icons/file-list-line";
import FileTransferFill from "@/icons/file-transfer-fill";
import FileTransferLine from "@/icons/file-transfer-line";
import FunctionFill from "@/icons/function-fill";
import FunctionLine from "@/icons/function-line";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserProfile } from "./user-profile";
import { SearchLine } from "@/icons/search-line";

export default function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="flex flex-col w-full max-w-[272px] h-full overflow-y-auto border-r border-gray-200">
			<div className="px-5 h-16 flex items-center">
				<h1 className="font-bold text-[20px] tracking-[-0.02em]">MediBridge</h1>
			</div>
			<div className="p-2">
				<div className="px-3 flex items-center gap-2 w-full h-9 mb-6 cursor-pointer hover:bg-gray-200 rounded-[8px]">
					<SearchLine className="size-5" aria-hidden />
					<p>Search... </p>
				</div>
				<ul className="flex flex-col gap-px">
					{menus.map(({ id, href, text }) => {
						const isActive = pathname === href;

						return (
							<li
								key={id}
								className={cn(
									"rounded-[8px] hover:bg-gray-200 font-medium",
									isActive && "bg-gray-200",
								)}
							>
								<Link href={href} className={cn("px-3 flex items-center gap-2 w-full h-9")}>
									<span>
										{id === "overview" ? (
											isActive ? (
												<FunctionFill className="size-5" />
											) : (
												<FunctionLine className="size-5" />
											)
										) : id === "patients-records" ? (
											isActive ? (
												<FileListFill className="size-5" />
											) : (
												<FileListLine className="size-5" />
											)
										) : id === "transfers" ? (
											isActive ? (
												<FileTransferFill className="size-5" />
											) : (
												<FileTransferLine className="size-5" />
											)
										) : null}
									</span>
									<span>{text}</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</div>

			<UserProfile />
		</aside>
	);
}

const menus = [
	{ id: "overview", text: "Overview", href: "/dashboard/overview" },
	{ id: "patients-records", text: "Patients Records", href: "/dashboard/patients-records" },
	{ id: "transfers", text: "Transfers", href: "/dashboard/transfers" },
] as const;
