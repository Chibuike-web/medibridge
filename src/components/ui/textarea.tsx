import { cn } from "@/lib/utils/cn";
import * as React from "react";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"placeholder:text-muted-foreground focus-visible:border-gray-400 focus-visible:ring-gray-100 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };

