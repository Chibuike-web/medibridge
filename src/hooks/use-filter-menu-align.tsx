"use client";

import { useRef, useState } from "react";

const FILTER_MENU_WIDTH_REM = 13.75;

export function useFilterMenuAlign() {
	const triggerElementRef = useRef<HTMLButtonElement | null>(null);
	const [align, setAlign] = useState<"start" | "end">("start");

	function setTriggerElement(triggerElement: HTMLButtonElement | null) {
		triggerElementRef.current = triggerElement;
	}

	function updateAlign(isOpen: boolean) {
		if (!isOpen || !triggerElementRef.current) return;

		const triggerLeft = triggerElementRef.current.getBoundingClientRect().left;
		const remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);
		const menuWidth = FILTER_MENU_WIDTH_REM * remInPixels;
		setAlign(triggerLeft + menuWidth <= window.innerWidth ? "start" : "end");
	}

	return { align, setTriggerElement, updateAlign };
}
