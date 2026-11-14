"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function AnimatedFilterChips({
	isVisible,
	children,
}: {
	isVisible: boolean;
	children: ReactNode;
}) {
	const shouldReduceMotion = useReducedMotion();

	return (
		<AnimatePresence initial={false}>
			{isVisible ? (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					exit={{ opacity: 0, height: 0 }}
					transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15 }}
					className="overflow-hidden"
				>
					{children}
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}
