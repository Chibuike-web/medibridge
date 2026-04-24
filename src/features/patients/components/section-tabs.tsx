"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Tabs } from "radix-ui";
import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";

export function SectionTabs() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const active = searchParams.get("section") ?? "patient-overview";

	function handleChange(value: string) {
		const params = new URLSearchParams(searchParams.toString());
		params.set("section", value);

		router.push(`?${params.toString()}`);
	}

	return (
		<Tabs.Root value={active} onValueChange={handleChange}>
			<Tabs.List className="no-scrollbar relative flex w-full overflow-x-auto border-b px-6 whitespace-nowrap">
				{sections.map((section) => {
					const isActive = active === section.id;

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
									transition={{ type: "spring", stiffness: 400, damping: 30 }}
								/>
							)}
						</Tabs.Trigger>
					);
				})}
			</Tabs.List>
		</Tabs.Root>
	);
}

export const sections = [
	{ id: "patient-overview", label: "Patient Overview" },
	{ id: "patient-details", label: "Patient Details" },
	{ id: "diagnoses", label: "Diagnoses" },
	{ id: "allergies", label: "Allergies" },
	{ id: "immunization", label: "Immunization" },
	{ id: "procedures", label: "Procedures" },
	{ id: "medications", label: "Medications" },
	{ id: "encounters", label: "Encounters" },
	{ id: "lab-tests", label: "Lab Tests" },
	{ id: "imaging", label: "Imaging" },
	{ id: "documents", label: "Documents" },
] as const;
