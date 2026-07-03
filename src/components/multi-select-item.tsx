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
				"flex min-h-9 w-full shrink-0 items-center justify-between rounded-md px-3 py-2 text-left text-sm",
				isSelected ? "bg-gray-200 text-foreground" : "text-gray-600 hover:bg-gray-100",
			)}
		>
			<span className="min-w-0 flex-1">{children}</span>
			{isSelected && <RiCheckLine className="size-4" />}
		</button>
	);
}
