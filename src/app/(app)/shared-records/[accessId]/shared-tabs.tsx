"use client";

import { startTransition, useOptimistic } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { sharedSections, type SharedSection } from "./shared-record-sections";
import { useReducedMotion, motion } from "motion/react";
import { Tabs } from "radix-ui";

type SharedTabsClientProps = {
	activeSection: SharedSection;
	availableSections: readonly SharedSection[];
};

export function SharedTabs({ activeSection, availableSections }: SharedTabsClientProps) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const shouldReduceMotion = useReducedMotion();

	const [optimisticSelectedSharedRecordSection, setOptimisticSelectedSharedRecordSection] =
		useOptimistic(activeSection);

	function handleClick(value: string) {
		const section = value as SharedSection;
		const params = new URLSearchParams(searchParams.toString());
		startTransition(() => {
			setOptimisticSelectedSharedRecordSection(section);
			params.set("section", section);
			router.push(`?${params.toString()}`);
		});
	}

	return (
		<Tabs.Root value={optimisticSelectedSharedRecordSection} onValueChange={handleClick}>
			<Tabs.List className="no-scrollbar relative  mx-auto flex w-full max-w-7xl overflow-x-auto border-b px-6 whitespace-nowrap">
				{sharedSections
					.filter((section) => availableSections.includes(section.id))
					.map((section) => {
						const isActive = optimisticSelectedSharedRecordSection === section.id;

						return (
							<Tabs.Trigger
								key={section.id}
								value={section.id}
								className={cn(
									"relative shrink-0 px-6 py-3 text-sm transition-colors",
									isActive ? "font-medium text-gray-800" : "font-normal text-gray-400",
								)}
							>
								{section.label}
								{isActive && (
									<motion.div
										layoutId="tab-indicator"
										className="absolute right-0 bottom-0 left-0 h-0.5 bg-black"
										transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", duration: 0.22, bounce: 0 }}
									/>
								)}
							</Tabs.Trigger>
						);
					})}
			</Tabs.List>
		</Tabs.Root>
	);
}
