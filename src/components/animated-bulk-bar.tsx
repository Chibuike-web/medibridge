"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function AnimatedBulkBar({ children }: { children: ReactNode }) {
	const shouldReduceMotion = useReducedMotion();

	return (
		<div className="pointer-events-none fixed inset-x-4 bottom-6 z-50 flex justify-center">
			<motion.div
				layout
				initial={{ opacity: 0, y: 16, scale: 0.95 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={
					shouldReduceMotion ? { duration: 0 } : { type: "spring", duration: 0.35, bounce: 0.35 }
				}
				// Motion only corrects radius and shadow during layout animations when they're inline pixels.
				style={{ borderRadius: 12, boxShadow: "0 16px 40px rgba(15,23,42,0.35)" }}
				className="no-scrollbar pointer-events-auto h-12 w-full overflow-x-auto border border-white/20 bg-gray-800 pr-2 pl-4 text-white tabular-nums ring ring-gray-800 sm:w-max"
			>
				<motion.div layout="position" className="flex h-full items-center gap-4">
					{children}
				</motion.div>
			</motion.div>
		</div>
	);
}
