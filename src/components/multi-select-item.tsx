"use client";

import { ReactNode } from "react";
import { RiCheckLine } from "@remixicon/react";
import { cn } from "@/lib/utils/cn";

type MultiSelectItemProps = {
	children: ReactNode;
	isSelected: boolean;
	onClick: () => void;
};

export function MultiSelectItem({ children, isSelected, onClick }: MultiSelectItemProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex w-full text-left items-center justify-between rounded-md px-3 h-11 text-sm",
				isSelected ? "bg-gray-200 text-foreground" : "text-gray-600 hover:bg-gray-50",
			)}
		>
			<span>{children}</span>
			{isSelected && <RiCheckLine className="size-4" />}
		</button>
	);
}
