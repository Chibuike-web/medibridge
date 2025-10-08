"use client";

import FileListFill from "@/icons/file-list-fill";
import FileListLine from "@/icons/file-list-line";
import FileTransferFill from "@/icons/file-transfer-fill";
import FileTransferLine from "@/icons/file-transfer-line";
import FunctionFill from "@/icons/function-fill";
import FunctionLine from "@/icons/function-line";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserProfile from "./user-profile";

export default function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="flex flex-col w-full max-w-[272px] h-full overflow-auto border-r border-gray-200">
			<div className="px-[20px] py-6">
				<h1 className="font-bold text-[20px] tracking-[-0.02em]">MediBridge</h1>
			</div>
			<ul className="p-4 flex flex-col gap-4">
				{menus.map(({ id, text }) => {
					const isActive = pathname === `/${id}`;
					return (
						<li
							key={id}
							className={cn(
								"h-[36px] flex items-center w-full rounded-[8px]",
								isActive ? "bg-gray-200" : ""
							)}
						>
							<Link
								href={`/${id}`}
								className={cn(
									"px-[12px] flex items-center gap-2 w-full",
									isActive && "font-semibold"
								)}
							>
								<span>
									{id === "dashboard" ? (
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

			<UserProfile />
		</aside>
	);
}

const menus = [
	{
		id: "dashboard",
		text: "Dashboard",
	},
	{
		id: "patients-records",
		text: "Patients Records",
	},
	{
		id: "transfers",
		text: "Transfers",
	},
];
