"use client";

import { useEffect, useState } from "react";

export function useDebounced<T>(value: T, delay = 500) {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timerId = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => clearTimeout(timerId);
	}, [value, delay]);

	return debouncedValue;
}
