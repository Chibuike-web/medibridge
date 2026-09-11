"use client";

import { cn } from "@/lib/utils/cn";
import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import { useState } from "react";

type CopyIdButtonProps = {
	id: string;
	className?: string;
};

export function CopyIdButton({ id, className }: CopyIdButtonProps) {
	const [isCopied, setIsCopied] = useState(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(id);
			setIsCopied(true);
			setTimeout(() => {
				setIsCopied(false);
			}, 2000);
		} catch {
			setIsCopied(false);
		}
	}

	return (
		<button
			type="button"
			onClick={(e) => {
				e.stopPropagation();
				handleCopy();
			}}
			className={cn(
				"flex w-25 shrink-0 items-center gap-1.5 rounded-md border border-gray-200 bg-gray-100 p-1 text-left text-gray-600 focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100",
				className,
			)}
			aria-label={isCopied ? `${id} copied` : `Copy ${id}`}
			title={isCopied ? "Copied" : "Copy ID"}
		>
			<span className="truncate font-medium">{id}</span>
			<span className="relative inline-flex size-5 items-center justify-center rounded">
				<span
					aria-hidden={!isCopied}
					className={cn(
						"absolute inset-0 flex items-center justify-center transition-[opacity,filter,scale] duration-300 ease-in-out will-change-[opacity,filter,scale] motion-reduce:transition-none",
						isCopied ? "scale-100 opacity-100 blur-0" : "blur-xs scale-[0.25] opacity-0",
					)}
				>
					<RiCheckLine className="size-4" />
				</span>
				<span
					aria-hidden={isCopied}
					className={cn(
						"flex items-center justify-center transition-[opacity,filter,scale] duration-300 ease-in-out will-change-[opacity,filter,scale] motion-reduce:transition-none",
						isCopied ? "blur-xs scale-[0.25] opacity-0" : "scale-100 opacity-100 blur-0",
					)}
				>
					<RiFileCopyLine className="size-4" />
				</span>
			</span>
		</button>
	);
}
