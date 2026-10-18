"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useEffect, useRef, useTransition, type ReactNode } from "react";

export const EncounterTableNavigationContext = createContext<
	((values: Record<string, string>, replace: boolean) => void) | null
>(null);

export function EncounterTableNavigation({ children }: { children: ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const pendingSearchParams = useRef<URLSearchParams | null>(null);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (!isPending) pendingSearchParams.current = null;
	}, [isPending, searchParams]);

	function navigateEncounterTable(values: Record<string, string>, replace: boolean) {
		// Merge overlapping table changes before the server commits the next URL.
		const params = new URLSearchParams(pendingSearchParams.current ?? searchParams.toString());
		Object.entries(values).forEach(([name, value]) => {
			if (value.trim() === "") params.delete(name);
			else params.set(name, value);
		});
		pendingSearchParams.current = params;

		startTransition(() => {
			const href = `${pathname}?${params}` as Route;
			if (replace) router.replace(href, { scroll: false });
			else router.push(href, { scroll: false });
		});
	}

	return (
		<EncounterTableNavigationContext value={navigateEncounterTable}>
			{children}
		</EncounterTableNavigationContext>
	);
}
