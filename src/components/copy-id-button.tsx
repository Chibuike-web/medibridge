"use client";

import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import { useEffect, useState } from "react";

type CopyIdButtonProps = {
	id: string;
};

export function CopyIdButton({ id }: CopyIdButtonProps) {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) {
			return;
		}
		const timeoutId = window.setTimeout(() => {
			setCopied(false);
		}, 1200);

		return () => window.clearTimeout(timeoutId);
	}, [copied]);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(id);
			setCopied(true);
		} catch {
			setCopied(false);
		}
	}

	return (
		<button
			type="button"
			onClick={handleCopy}
			className="flex w-max items-center gap-[6px] rounded-[6px] border border-gray-200 bg-gray-100 p-1 text-left text-gray-600 transition-transform duration-150 ease-out active:scale-90"
			aria-label={copied ? `${id} copied` : `Copy ${id}`}
			title={copied ? "Copied" : "Copy ID"}
		>
			<span className="font-medium">{id}</span>
			<span className="inline-flex size-5 items-center justify-center rounded-[4px]">
				{copied ? <RiCheckLine className="size-4" /> : <RiFileCopyLine className="size-4" />}
			</span>
		</button>
	);
}
