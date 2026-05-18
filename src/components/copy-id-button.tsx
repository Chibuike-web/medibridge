"use client";

import { cn } from "@/lib/utils/cn";
import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import { useState } from "react";

type CopyIdButtonProps = {
	id: string;
	className?: string;
};

export function CopyIdButton({ id, className }: CopyIdButtonProps) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(id);
			setCopied(true);
			setTimeout(() => {
				setCopied(false);
			}, 2000);
		} catch {
			setCopied(false);
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
				"flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-100 p-1 text-left text-gray-600 transition-transform duration-150 ease-out active:scale-90 shrink-0",
				className,
			)}
			aria-label={copied ? `${id} copied` : `Copy ${id}`}
			title={copied ? "Copied" : "Copy ID"}
		>
			<span className="truncate font-medium">{id}</span>
			<span className="inline-flex size-5 items-center justify-center rounded">
				{copied ? <RiCheckLine className="size-4" /> : <RiFileCopyLine className="size-4" />}
			</span>
		</button>
	);
}
