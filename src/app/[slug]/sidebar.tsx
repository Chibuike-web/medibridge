import { cn } from "@/lib/utils";
import { FileCode2, FileInput, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function Sidebar({ activeId }: { activeId: string }) {
	const menuIcon = {};

	return (
		<aside className="w-[267px] h-full overflow-auto border-r border-gray-200">
			<div className="px-[20px] py-6">
				<h1 className="font-bold text-[20px] tracking-[-0.02em]">MediBridge</h1>
			</div>
			<ul className="p-4 flex flex-col gap-4">
				{menus.map(({ id, text }) => {
					const isActive = activeId === id;
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
										<LayoutDashboard
											className={`size-5 ${isActive ? "text-gray-800" : "text-gray-500"}`}
										/>
									) : id === "patients-records" ? (
										<FileCode2
											className={`size-5 ${isActive ? "text-gray-800" : "text-gray-500"}`}
										/>
									) : id === "transfers" ? (
										<FileInput
											className={`size-5 ${isActive ? "text-gray-800" : "text-gray-500"}`}
										/>
									) : (
										""
									)}
								</span>
								<span>{text}</span>
							</Link>
						</li>
					);
				})}
			</ul>
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
