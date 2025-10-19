import MotionDiv from "@/lib/motion-wrapper";
import { useEffect, useRef } from "react";

type DialogType = {
	children: React.ReactNode;
	handleClick: () => void;
};

const modalVariants = {
	hidden: { opacity: 0, scale: 0.9 },
	visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
	exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

export function DialogBackdrop({ children, handleClick }: DialogType) {
	return (
		<div
			className="bg-foreground/80 fixed inset-0 backdrop-blur-[4px] flex items-center justify-center px-6 xl:px-0"
			onClick={() => handleClick()}
		>
			{children}
		</div>
	);
}

export function DialogMain({ children }: { children: React.ReactNode }) {
	const hasAnimatedRef = useRef(false);

	useEffect(() => {
		const t = setTimeout(() => {
			hasAnimatedRef.current = true;
		}, 200);
		return () => clearTimeout(t);
	}, []);

	return (
		<MotionDiv
			variants={modalVariants}
			initial={hasAnimatedRef.current ? false : "hidden"}
			animate="visible"
			exit="exit"
			onClick={(e) => e.stopPropagation()}
			className="bg-white max-w-[600px] w-full rounded-[24px] flex flex-col"
		>
			{children}
		</MotionDiv>
	);
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
	return <div className="flex justify-between items-center">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
	return <div>{children}</div>;
}

export function DialogClose({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}

export function DialogContent({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
