"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils/cn";
import { RiCheckLine } from "@remixicon/react";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={cn(
				"group peer border-input dark:bg-input/30",
				"data-[state=checked]:bg-primary",
				"data-[state=checked]:text-primary-foreground",
				"data-[state=checked]:border-primary",

				"data-[state=indeterminate]:bg-primary",
				"data-[state=indeterminate]:text-primary-foreground",
				"data-[state=indeterminate]:border-primary",

				"focus-visible:border-ring focus-visible:ring-ring/50",
				"aria-invalid:ring-destructive/20",
				"dark:aria-invalid:ring-destructive/40 ",
				"aria-invalid:border-destructive",
				"size-4 shrink-0 rounded border shadow-xs transition-shadow",
				" outline-none focus-visible:ring-3",
				"disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator className="grid place-content-center text-current">
				<span className="group-data-[state=checked]:block group-data-[state=indeterminate]:hidden">
					<RiCheckLine className="size-3.5" />
				</span>

				<span className="group-data-[state=checked]:hidden group-data-[state=indeterminate]:block">
					<div className="h-[2px] w-2 bg-current" />
				</span>
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
