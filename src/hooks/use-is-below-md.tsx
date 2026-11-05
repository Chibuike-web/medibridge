"use client";

import { useSyncExternalStore } from "react";

const BELOW_MD_QUERY = "(width < 48rem)";

export function useIsBelowMd() {
	return useSyncExternalStore(
		(onChange) => {
			const mediaQuery = window.matchMedia(BELOW_MD_QUERY);
			mediaQuery.addEventListener("change", onChange);
			return () => mediaQuery.removeEventListener("change", onChange);
		},
		() => window.matchMedia(BELOW_MD_QUERY).matches,
		() => false,
	);
}
