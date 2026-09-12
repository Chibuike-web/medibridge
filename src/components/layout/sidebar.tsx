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
import { ComponentType, useCallback, useEffect, useRef, useState } from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "../ui/command";
import { DialogClose, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import type { Route } from "next";
import { Button } from "../ui/button";

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
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedSearchTab, setSelectedSearchTab] = useState<SearchTab>("All");
	const tabsRef = useRef<(HTMLElement | null)[]>([]);
	const startXRef = useRef(0);
	const startWidthRef = useRef(0);
	const isCollapsed = width < COLLAPSE_THRESHOLD;

	useEffect(
		function saveSidebarWidth() {
			document.cookie = `sidebarWidth=${width}; path=/; max-age=31536000`;
		},
		[width],
	);

	useEffect(
		function registerSearchShortcut() {
			function handleSearchShortcut(event: KeyboardEvent) {
				if (isSearchOpen || (!event.ctrlKey && !event.metaKey) || event.key.toLowerCase() !== "k") {
					return;
				}

				event.preventDefault();
				setIsSearchOpen(true);
			}

			window.addEventListener("keydown", handleSearchShortcut);
			return () => window.removeEventListener("keydown", handleSearchShortcut);
		},
		[isSearchOpen],
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

	const activeIndex = searchTabs.findIndex((t) => t === selectedSearchTab);

	const positionSearchIndicator = useCallback(
		(indicator: HTMLSpanElement | null) => {
			const container = indicator?.parentElement;
			const activeTab = tabsRef.current[activeIndex];
			if (!indicator || !container || !activeTab) return;

			const updateIndicator = () => {
				indicator.style.transform = `translate(${activeTab.offsetLeft}px, ${activeTab.offsetTop}px)`;
				indicator.style.width = `${activeTab.offsetWidth}px`;
				indicator.style.height = `${activeTab.offsetHeight}px`;
			};

			updateIndicator();

			if (!indicator.dataset.positioned) {
				// Commit the first position without a transition.
				indicator.getBoundingClientRect();
				indicator.dataset.positioned = "true";
			}
			if (typeof ResizeObserver === "undefined") return;

			const resizeObserver = new ResizeObserver(updateIndicator);
			resizeObserver.observe(container);
			for (const tab of tabsRef.current) {
				if (tab) resizeObserver.observe(tab);
			}

			return () => resizeObserver.disconnect();
		},
		[activeIndex],
	);

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
								"absolute inset-0 flex items-center justify-center rounded-lg border border-transparent hover:bg-gray-100 focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100 transition-[opacity,filter,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none motion-reduce:blur-0",
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
							className="flex size-10 items-center justify-center rounded-lg border border-transparent hover:bg-gray-100 focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100"
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
							"flex h-8 w-full items-center gap-2 rounded-lg border border-transparent px-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100",
							isCollapsed ? "justify-center" : "",
						)}
						aria-label="Search chats"
						onClick={() => setIsSearchOpen(true)}
					>
						<RiSearchLine className="size-4 shrink-0" aria-hidden />
						{!isCollapsed ? <span className="whitespace-nowrap">Search...</span> : null}
					</button>
					<CommandDialog
						open={isSearchOpen}
						onOpenChange={(open) => {
							setIsSearchOpen(open);
							if (!open) {
								setSearchQuery("");
								setSelectedSearchTab("All");
							}
						}}
						label="Search chats"
						contentClassName="h-auto max-w-[50rem] overflow-hidden p-0 text-sm md:h-[35.875rem]"
					>
						<DialogHeader>
							<DialogTitle className="sr-only">Search chats</DialogTitle>
							<DialogDescription className="sr-only">
								Search patients, IDs, diagnoses, and other patient records.
							</DialogDescription>
							<CommandInput
								value={searchQuery}
								onValueChange={setSearchQuery}
								placeholder="Search patients, IDs, diagnoses..."
							/>
							{searchQuery.trim() ? (
								<Button
									variant="ghost"
									type="button"
									onClick={() => {
										setSearchQuery("");
										setSelectedSearchTab("All");
									}}
								>
									Clear
								</Button>
							) : null}
							<DialogClose asChild>
								<Button variant="ghost" type="button" size="icon">
									<RiCloseLine className="size-5" aria-hidden="true" />
								</Button>
							</DialogClose>
						</DialogHeader>
						<CommandList className="max-h-[31.25rem]">
							{!searchQuery.trim() ? (
								<div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-sm">
									<p className="text-gray-600">No recent activity</p>
									<p className="text-gray-400">
										Search by patient name, record ID, diagnosis, or transfer.
									</p>
								</div>
							) : null}
							{searchQuery.trim() ? (
								<div
									className="flex flex-wrap gap-1.5 px-4 pt-4 pb-2 relative"
									role="tablist"
									aria-label="Search result types"
								>
									{searchTabs.map((tab, index) => (
										<button
											ref={(el) => {
												tabsRef.current[index] = el;
											}}
											key={tab}
											type="button"
											role="tab"
											aria-selected={selectedSearchTab === tab}
											className={cn(
												"relative z-10 rounded-full border border-transparent px-2.5 h-8 text-sm text-gray-600 focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100",
												selectedSearchTab === tab && "text-white",
											)}
											onClick={() => setSelectedSearchTab(tab)}
										>
											{tab}
										</button>
									))}
									<span
										ref={positionSearchIndicator}
										aria-hidden="true"
										className="pointer-events-none absolute left-0 top-0 rounded-full bg-gray-800 data-[positioned=true]:transition-[transform,width,height] data-[positioned=true]:duration-200 motion-reduce:transition-none"
									/>
								</div>
							) : null}
							<CommandEmpty>No matching results.</CommandEmpty>
							{searchSections.map((section) => {
								const isNavigation = section.label === "Go to";
								const sectionItems = section.items.filter((entry) =>
									isSearchEntryInTab(entry.id, selectedSearchTab),
								);
								if (!sectionItems.length) return null;

								return (
									<CommandGroup key={section.label} heading={section.label}>
										{sectionItems.map((entry) => {
											const Icon = isNavigation ? RiArrowRightLine : RiAddLine;

											return (
												<DialogClose asChild key={entry.id}>
													<CommandItem asChild value={`${entry.title} ${entry.description}`}>
														<Link href={entry.href}>
															<Icon className="shrink-0 text-gray-600 size-4" aria-hidden="true" />

															<div className="min-w-0">
																<p className="font-medium text-gray-700">{entry.title}</p>

																<p className="text-sm text-gray-400">{entry.description}</p>
															</div>
														</Link>
													</CommandItem>
												</DialogClose>
											);
										})}
									</CommandGroup>
								);
							})}
						</CommandList>
					</CommandDialog>
				</li>
				{menus.map(({ id, href, label, icon: Icon, activeIcon: ActiveIcon }) => {
					const isActive = pathname.startsWith(href);

					return (
						<li key={id}>
							<Link
								href={href}
								className={cn(
									"flex h-8 w-full items-center gap-2 rounded-lg border border-transparent px-2.5 font-medium text-gray-600 transition-[background-color,box-shadow] hover:bg-gray-100 hover:text-gray-800 focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100",
									isActive && "bg-gray-200 text-gray-800",
									isCollapsed ? "justify-center" : "justify-start",
								)}
								aria-label={isCollapsed ? label : undefined}
							>
								<span className="shrink-0">
									{isActive ? (
										<ActiveIcon className="size-4 shrink-0" />
									) : (
										<Icon className="size-4 shrink-0" />
									)}
								</span>
								{!isCollapsed ? <span className="whitespace-nowrap">{label}</span> : null}
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

type MenuId = "overview" | "patients" | "transfers";

type Menu = {
	id: MenuId;
	label: string;
	href: Route;
	icon: ComponentType<{ className?: string }>;
	activeIcon: ComponentType<{ className?: string }>;
};
const menus: Menu[] = [
	{
		id: "overview",
		label: "Overview",
		href: "/dashboard/overview",
		icon: RiFunctionLine,
		activeIcon: RiFunctionFill,
	},
	{
		id: "patients",
		label: "Patients",
		href: "/dashboard/patients",
		icon: RiFileList3Line,
		activeIcon: RiFileList3Fill,
	},
	{
		id: "transfers",
		label: "Transfers",
		href: "/dashboard/transfers",
		icon: RiFileTransferLine,
		activeIcon: RiFileTransferFill,
	},
];

type SearchSection = {
	label: string;
	items: {
		id: string;
		title: string;
		description: string;
		href: Route;
	}[];
};

const searchTabs = [
	"All",
	"Patients",
	"Transfers",
	"Vitals",
	"Diagnoses",
	"Allergies",
	"Immunizations",
	"Procedures",
	"Medications",
	"Labs",
	"Imaging",
	"Documents",
] as const;
type SearchTab = (typeof searchTabs)[number];

function isSearchEntryInTab(entryId: string, tab: SearchTab) {
	if (tab === "All") return true;
	if (tab === "Patients") return entryId === "patients" || entryId === "add-patient";
	if (tab === "Transfers") {
		return entryId === "transfers" || entryId === "create-transfer-request";
	}
	return false;
}

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
