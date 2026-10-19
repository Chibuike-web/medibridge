"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, use, useEffect, useRef, useTransition, type ReactNode } from "react";

const TableUrlNavigationContext = createContext<
	((values: Record<string, string>, options: { replace?: boolean }) => void) | null
>(null);

export function useTableUrlNavigation() {
	const navigateTableUrl = use(TableUrlNavigationContext);
	if (!navigateTableUrl) {
		throw new Error("useTableUrlNavigation must be used within TableUrlNavigation");
	}
	return navigateTableUrl;
}

export function TableUrlNavigation({ children }: { children: ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const pendingSearchParams = useRef<URLSearchParams | null>(null);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (!isPending) pendingSearchParams.current = null;
	}, [isPending, searchParams]);

	function navigateTableUrl(
		values: Record<string, string>,
		{ replace = false }: { replace?: boolean },
	) {
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

	return <TableUrlNavigationContext value={navigateTableUrl}>{children}</TableUrlNavigationContext>;
}
