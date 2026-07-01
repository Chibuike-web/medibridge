"use client";

import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserProfile } from "@/components/layout/user-profile";
import {
	RiAddLine,
	RiArrowRightLine,
	RiCloseLine,
	RiContractLeftLine,
	RiFileList3Fill,
	RiFileList3Line,
	RiFileTransferFill,
	RiFileTransferLine,
	RiFunctionFill,
	RiFunctionLine,
	RiSearchLine,
} from "@remixicon/react";
import { useEffect, useRef, useState } from "react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import type { Route } from "next";

const MIN_WIDTH = 56;
const MAX_WIDTH = 272;
const COLLAPSE_THRESHOLD = 200;

export function Sidebar({ initialWidth }: { initialWidth?: string }) {
	const parsedWidth = Number(initialWidth ?? MAX_WIDTH);
	const [width, setWidth] = useState(
		parsedWidth >= MIN_WIDTH && parsedWidth <= MAX_WIDTH ? parsedWidth : MAX_WIDTH,
	);
	const pathname = usePathname();
	const [isResizing, setIsResizing] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const startXRef = useRef(0);
	const startWidthRef = useRef(0);
	const isCollapsed = width < COLLAPSE_THRESHOLD;

	useEffect(
		function saveSidebarWidth() {
			document.cookie = `sidebarWidth=${width}; path=/; max-age=31536000`;
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
					"relative h-14 flex items-center transition-[padding] duration-300 ease-in-out",
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
								"text-xl font-bold absolute inset-0 flex items-center justify-center transition-[opacity,filter] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none motion-reduce:blur-0",
								isHovered ? "opacity-0 blur-sm" : "opacity-100 blur-0",
							)}
						>
							MB
						</h1>
						<button
							onClick={toggleSidebar}
							aria-label="Expand sidebar"
							className={cn(
								"absolute inset-0 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-[opacity,filter,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none motion-reduce:blur-0",
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
								"overflow-hidden font-bold tracking-[-0.02em] whitespace-nowrap transition-[opacity,width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
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
					<Dialog>
						<DialogTrigger asChild>
							<button
								type="button"
								className={cn(
									"flex w-full items-center gap-2 rounded-lg hover:bg-gray-100 px-2.5 h-8",
									isCollapsed ? "justify-center" : "",
								)}
								aria-label="Search chats"
							>
								<RiSearchLine className="size-4 shrink-0" aria-hidden />
								{!isCollapsed ? <span className="whitespace-nowrap">Search...</span> : null}
							</button>
						</DialogTrigger>
						<DialogContent className="max-w-[50rem] text-sm">
							<DialogHeader className="h-16 px-6 border-b border-gray-200">
								<DialogTitle className="sr-only">Search chats</DialogTitle>
								<DialogDescription className="sr-only">
									Search patients, IDs, diagnoses, and other patient records.
								</DialogDescription>
								<input
									className="h-9 w-full placeholder:text-sm placeholder:text-gray-400 focus:outline-0"
									type="text"
									placeholder="Search patients, IDs, diagnoses..."
								/>
								<DialogDescription className="sr-only">Search dialog </DialogDescription>
								<DialogClose>
									<RiCloseLine className="size-5" />
								</DialogClose>
							</DialogHeader>
							<div className="my-12 w-full px-6">
								<p className="text-center w-full text-gray-600">No recent activity</p>
								<p className="text-center w-full text-gray-400">
									Search by patient name, record ID,diagnosis, or transfer.
								</p>
							</div>
							<div className="px-4">
								{searchSections.map((section) => {
									const isNavigation = section.label === "Go to";

									return (
										<div key={section.label} className="mb-6">
											<p className="text-sm font-medium text-gray-400 mb-2">{section.label}</p>

											<div>
												{section.items.map((entry) => {
													const Icon = isNavigation ? RiArrowRightLine : RiAddLine;

													return (
														<DialogClose asChild key={entry.id}>
															<Link
																href={entry.href}
																className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-gray-100 transition-colors"
															>
																<Icon className="shrink-0 text-gray-600 size-4" />

																<div className="min-w-0">
																	<p className="font-medium text-gray-700">{entry.title}</p>

																	<p className="text-sm text-gray-400">{entry.description}</p>
																</div>
															</Link>
														</DialogClose>
													);
												})}
											</div>
										</div>
									);
								})}
							</div>
						</DialogContent>
					</Dialog>
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
								className={cn(
									"flex w-full items-center gap-2",
									isCollapsed ? "justify-center" : "justify-start",
								)}
								aria-label={isCollapsed ? text : undefined}
							>
								<span className="shrink-0">
									{id === "overview" ? (
										isActive ? (
											<RiFunctionFill className="size-4 shrink-0" />
										) : (
											<RiFunctionLine className="size-4 shrink-0" />
										)
									) : id === "patients" ? (
										isActive ? (
											<RiFileList3Fill className="size-4 shrink-0" />
										) : (
											<RiFileList3Line className="size-4 shrink-0" />
										)
									) : id === "transfers" ? (
										isActive ? (
											<RiFileTransferFill className="size-4 shrink-0" />
										) : (
											<RiFileTransferLine className="size-4 shrink-0" />
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

type SearchSection = {
	label: string;
	items: {
		id: string;
		title: string;
		description: string;
		href: Route;
	}[];
};

export const searchSections: SearchSection[] = [
	{
		label: "Go to",
		items: [
			{
				id: "patients",
				title: "Patients",
				description: "View and manage patient records",
				href: "/dashboard/patients",
			},
			{
				id: "transfers",
				title: "Transfers",
				description: "Manage patient transfer requests",
				href: "/dashboard/transfers",
			},
		],
	},
	{
		label: "Quick actions",
		items: [
			{
				id: "add-patient",
				title: "Add patient",
				description: "Create a new patient record",
				href: "/dashboard/add-new-patient",
			},

			{
				id: "create-transfer-request",
				title: "Create transfer request",
				description: "Create a patient transfer request",
				href: "/dashboard/new-transfer-request",
			},
		],
	},
];
