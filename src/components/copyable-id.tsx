"use client";

import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function CopyableId({ id }: { id: string }) {
	const [isCopied, setIsCopied] = useState(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(id);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		} catch {
			setIsCopied(false);
		}
	}

	return (
		<Button
			type="button"
			variant="ghost"
			className="h-auto gap-1.5 p-0 text-left text-sm font-semibold whitespace-normal text-gray-700 hover:bg-transparent hover:text-gray-700"
			aria-label={isCopied ? `${id} copied` : `Copy ${id}`}
			title={isCopied ? "Copied" : "Copy ID"}
			onClick={handleCopy}
		>
			<span className="break-all">{id}</span>
			<span className="relative inline-flex size-4 shrink-0 items-center justify-center text-gray-500">
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
		</Button>
	);
}
