"use client";

import { ReactNode } from "react";
import { RiCheckLine } from "@remixicon/react";
import { cn } from "@/lib/utils/cn";

type CheckButtonProps = {
	children: ReactNode;
	isSelected: boolean;
	onClick: () => void;
};

export function CheckButton({ children, isSelected, onClick }: CheckButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"px-3.5 py-2 border rounded-full text-gray-400 flex items-center gap-2 focus:outline-0 focus-visible:ring-ring/50 focus-visible:ring-3",
				isSelected
					? "border-foreground text-foreground bg-foreground/5"
					: "border-gray-200 text-gray-500",
			)}
		>
			<span>{children}</span>
			{isSelected && <RiCheckLine className="size-4" />}
		</button>
	);
}
