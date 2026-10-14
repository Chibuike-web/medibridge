"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { RiCheckboxCircleFill, RiCloseLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";

export function EncounterCreatedBanner() {
	const router = useRouter();
	const pathname = usePathname();

	return (
		<div
			role="status"
			className="mb-6 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm font-medium text-green-700"
		>
			<RiCheckboxCircleFill className="size-4 shrink-0" aria-hidden="true" />
			<p className="min-w-0 flex-1">Encounter created.</p>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="ml-auto -my-1 size-6 rounded-full text-green-700 hover:bg-green-100 hover:text-green-700"
				aria-label="Dismiss message"
				onClick={() => router.replace(pathname as Route, { scroll: false })}
			>
				<RiCloseLine aria-hidden="true" />
			</Button>
		</div>
	);
}
