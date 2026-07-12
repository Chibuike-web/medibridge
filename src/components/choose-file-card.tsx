"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ChangeEvent, RefObject } from "react";
import { cn } from "@/lib/utils/cn";
import { RiUploadCloud2Line } from "@remixicon/react";

type FileUploadCardProps = {
	inputId: string;
	fileInputRef: RefObject<HTMLInputElement | null>;
	onFilesSelected: (event: ChangeEvent<HTMLInputElement>) => void;
	title: string;
	description: string;
	browseLabel: string;
	accept?: string;
	multiple?: boolean;
	error?: string;
};

export function ChooseFileCard({
	inputId,
	fileInputRef,
	onFilesSelected,
	title,
	description,
	browseLabel,
	accept,
	multiple = true,
	error,
}: FileUploadCardProps) {
	return (
		<div
			className={cn(
				"relative flex w-full flex-col items-center gap-5 rounded-lg border border-dashed border-gray-200 p-8",
				error && "border-red-500",
			)}
		>
			<Label htmlFor={inputId} className="sr-only">
				{title}
			</Label>

			<input
				id={inputId}
				ref={fileInputRef}
				type="file"
				accept={accept}
				multiple={multiple}
				onChange={onFilesSelected}
				className="sr-only"
				aria-describedby={error ? `${inputId}-error` : undefined}
			/>

			<RiUploadCloud2Line className="size-5 text-gray-600" aria-hidden="true" />

			<div className="flex flex-col items-center gap-1.5 text-center">
				<p className="text-sm font-medium text-gray-800">{title}</p>
				<p className="text-xs text-gray-600">{description}</p>
			</div>

			<Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
				{browseLabel}
			</Button>

			{error ? (
				<p id={`${inputId}-error`} className="text-xs text-red-600">
					{error}
				</p>
			) : null}
		</div>
	);
}
