"use client";

import { ReactNode } from "react";
import { RiCheckLine } from "@remixicon/react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

type MultiSelectItemProps = {
	children: ReactNode;
	isSelected: boolean;
	onClick: () => void;
};

export function MultiSelectItem({ children, isSelected, onClick }: MultiSelectItemProps) {
	return (
		<Button
			variant="ghost"
			type="button"
			onClick={onClick}
			className={cn(
				"flex min-h-9 w-full justify-between px-3 text-left h-auto gap-0 whitespace-normal font-normal border-0 focus-visible:border-0",
				isSelected
					? "bg-gray-200 text-foreground hover:bg-gray-200 hover:text-foreground"
					: "text-gray-600 hover:bg-gray-100 hover:text-gray-600",
			)}
		>
			<span className="min-w-0 flex-1">{children}</span>
			{isSelected && <RiCheckLine className="size-4" />}
		</Button>
	);
}
