"use client";

import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserProfile } from "@/components/layout/user-profile";
import {
	RiContractLeftLine,
	RiFileListFill,
	RiFileListLine,
	RiFileTransferFill,
	RiFileTransferLine,
	RiFunctionFill,
	RiFunctionLine,
	RiSearchLine,
} from "@remixicon/react";
import { useEffect, useRef, useState } from "react";

const MIN_WIDTH = 56;
const MAX_WIDTH = 272;
const COLLAPSE_THRESHOLD = 200;

export function Sidebar({ initialWidth }: { initialWidth?: string }) {
	const parsed = initialWidth ? JSON.parse(initialWidth) : MAX_WIDTH;
	const [width, setWidth] = useState<number>(parsed);
	const pathname = usePathname();
	const [isResizing, setIsResizing] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const startXRef = useRef(0);
	const startWidthRef = useRef(0);
	const isCollapsed = width < COLLAPSE_THRESHOLD;

	useEffect(
		function saveSidebarWidth() {
			const value = JSON.stringify(width);
			document.cookie = `sidebarWidth=${value}; path=/; max-age=31536000`;
		},
		[width],
	);

	function toggleSidebar() {
		setIsHovered(false);
		setWidth((prev) => (prev < COLLAPSE_THRESHOLD ? MAX_WIDTH : MIN_WIDTH));
	}

	function handleMouseDown(e: React.MouseEvent) {
		e.preventDefault();
		setIsHovered(false);
		setIsResizing(true);
		startXRef.current = e.clientX;
		startWidthRef.current = width;

		const handleMouseMove = (e: MouseEvent) => {
			setIsHovered(false);
			const delta = e.clientX - startXRef.current;
			const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
			setWidth(newWidth);
		};
		const handleMouseUp = () => {
			setIsResizing(false);
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
	}

	return (
		<aside
			className={cn(
				"group/sidebar relative flex h-full shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-gray-200",
				isResizing ? "" : "transition-[width] duration-300 ease-in-out",
			)}
			style={{ width }}
		>
			<div
				className={cn(
					"relative h-16 flex items-center transition-[padding] duration-300 ease-in-out",
					isCollapsed ? "justify-center px-2" : "justify-between pl-5 pr-2",
				)}
			>
				{isCollapsed ? (
					<div
						className="relative size-10"
						onMouseEnter={() => setIsHovered(true)}
						onMouseLeave={() => setIsHovered(false)}
					>
						<h1
							className={cn(
								"text-xl font-bold absolute inset-0 flex items-center justify-center transition-all duration-200",
								isHovered ? "opacity-0 blur-sm" : "opacity-100 blur-0",
							)}
						>
							MB
						</h1>
						<button
							onClick={toggleSidebar}
							aria-label="Expand sidebar"
							className={cn(
								"absolute inset-0 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all duration-200",
								isHovered ? "opacity-100 blur-0" : "opacity-0 blur-sm",
							)}
						>
							<RiContractLeftLine className="size-5 shrink-0" aria-hidden />
						</button>
					</div>
				) : (
					<>
						<h1
							className={cn(
								"overflow-hidden font-bold tracking-[-0.02em] whitespace-nowrap transition-all duration-300 ease-in-out",
								"w-auto opacity-100 text-xl",
							)}
						>
							MediBridge
						</h1>
						<button
							onClick={toggleSidebar}
							aria-label="Collapse sidebar"
							className="flex size-10 items-center justify-center rounded-lg hover:bg-gray-100"
						>
							<RiContractLeftLine className="size-5 shrink-0" aria-hidden />
						</button>
					</>
				)}
			</div>

			<ul className="flex flex-col gap-px p-2 text-sm">
				<li>
					<button
						type="button"
						className={cn(
							"flex w-full items-center gap-2 rounded-lg hover:bg-gray-100 px-2.5 h-8",
							isCollapsed ? "justify-center" : "",
						)}
						aria-label="Search chats"
					>
						<RiSearchLine className="size-5 shrink-0" aria-hidden />
						{!isCollapsed ? <span className="whitespace-nowrap">Search...</span> : null}
					</button>
				</li>
				{menus.map(({ id, href, text }) => {
					const isActive = pathname.startsWith(href);

					return (
						<li
							key={id}
							className={cn(
								"hover:bg-gray-100 font-medium h-8 px-2.5 flex items-center",
								isActive && "bg-gray-200",
								isCollapsed ? "justify-center rounded-md" : "rounded-lg",
							)}
						>
							<Link
								href={href}
								prefetch={true}
								className={cn(
									"flex w-full items-center gap-2",
									isCollapsed ? "justify-center" : "justify-start",
								)}
								aria-label={isCollapsed ? text : undefined}
							>
								<span className="shrink-0">
									{id === "overview" ? (
										isActive ? (
											<RiFunctionFill className="size-5 shrink-0" />
										) : (
											<RiFunctionLine className="size-5 shrink-0" />
										)
									) : id === "patients" ? (
										isActive ? (
											<RiFileListFill className="size-5 shrink-0" />
										) : (
											<RiFileListLine className="size-5 shrink-0" />
										)
									) : id === "transfers" ? (
										isActive ? (
											<RiFileTransferFill className="size-5 shrink-0" />
										) : (
											<RiFileTransferLine className="size-5 shrink-0" />
										)
									) : null}
								</span>
								{!isCollapsed ? <span className="whitespace-nowrap">{text}</span> : null}
							</Link>
						</li>
					);
				})}
			</ul>

			<UserProfile isCollapsed={isCollapsed} />
			<div
				className={cn(
					"absolute right-0 top-0 bottom-0 w-1 cursor-col-resize",
					"hover:bg-gray-100",
					isResizing ? "bg-gray-100" : "",
				)}
				onMouseDown={handleMouseDown}
			/>
		</aside>
	);
}

const menus = [
	{ id: "overview", text: "Overview", href: "/dashboard/overview" },
	{ id: "patients", text: "Patients", href: "/dashboard/patients" },
	{ id: "transfers", text: "Transfers", href: "/dashboard/transfers" },
] as const;
