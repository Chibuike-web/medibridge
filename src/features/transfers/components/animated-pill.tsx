"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ComponentProps } from "react";

export function AnimatedPill({
	ref,
	className,
	children,
}: Pick<ComponentProps<"div">, "ref" | "className" | "children">) {
	const shouldReduceMotion = useReducedMotion();

	return (
		<motion.div
			ref={ref}
			layout
			initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
			animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
			exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
			transition={
				shouldReduceMotion ? { duration: 0 } : { type: "spring", duration: 0.25, bounce: 0 }
			}
			className={className}
		>
			{children}
		</motion.div>
	);
}
