import { type MotionProps, motion } from "motion/react";
import type { ElementType, ReactNode } from "react";

type MotionDivProps = MotionProps & {
	children: ReactNode;
	as?: ElementType;
};

export default function MotionDiv({ children, as: Component = "div", ...props }: MotionDivProps) {
	const MotionComponent = motion(Component);
	return <MotionComponent {...props}>{children}</MotionComponent>;
}
