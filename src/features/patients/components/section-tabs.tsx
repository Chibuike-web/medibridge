"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Tabs } from "radix-ui";
import { motion } from "motion/react";

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
			<Tabs.List className="flex border-b relative px-6">
				{sections.map((section) => {
					const isActive = active === section.id;

					return (
						<Tabs.Trigger
							key={section.id}
							value={section.id}
							className="relative py-3 px-6 text-sm font-medium shrink-0"
						>
							{section.label}
							{isActive && (
								<motion.div
									layoutId="tab-indicator"
									className="absolute bottom-0 left-0 right-0 h-[2px] bg-black"
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
	{ id: "medical-history", label: "Medical History" },
	{ id: "medications", label: "Medications" },
	{ id: "encounters", label: "Encounters" },
	{ id: "lab-tests", label: "Lab Tests" },
	{ id: "imaging-studies", label: "Imaging" },
	{ id: "documents", label: "Documents" },
] as const;
