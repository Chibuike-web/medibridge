"use client";

import { useCallback, useRef } from "react";

export function useDebouncedCallback<T extends (...args: never[]) => void>(
	callback: T,
	delay = 500,
) {
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	return useCallback(
		(...args: Parameters<T>) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				callbackRef.current(...args);
			}, delay);
		},
		[delay],
	);
}
