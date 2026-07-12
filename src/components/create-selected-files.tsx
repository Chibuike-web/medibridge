"use client";

import { Button } from "@/components/ui/button";
import { getDocumentFileIcon } from "@/lib/utils/document-file-icon";
import { RiAddLine } from "@remixicon/react";
import Image from "next/image";
import type { ChangeEvent, RefObject } from "react";

type CreateSelectedFilesProps = {
	files: File[];
	fileInputRef: RefObject<HTMLInputElement | null>;
	onFilesSelected: (event: ChangeEvent<HTMLInputElement>) => void;
	onRemoveFile: (file: File) => void;
};

export function CreateSelectedFiles({
	files,
	fileInputRef,
	onFilesSelected,
	onRemoveFile,
}: CreateSelectedFilesProps) {
	function handleOpenFile(file: File) {
		const fileUrl = URL.createObjectURL(file);
		window.open(fileUrl, "_blank", "noopener,noreferrer");

		window.setTimeout(() => {
			URL.revokeObjectURL(fileUrl);
		}, 60_000);
	}

	return (
		<>
			<div className="flex flex-col gap-3">
				{files.map((file) => (
					<div
						key={`${file.name}-${file.lastModified}`}
						className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4"
					>
						<Image
							src={getDocumentFileIcon(file.name, file.type)}
							alt=""
							width={44}
							height={44}
							className="size-11 shrink-0"
						/>

						<div className="min-w-0 flex-1">
							<p className="truncate font-semibold text-gray-800">{file.name}</p>

							<p className="text-gray-400">{Math.round(file.size / 1024)}KB · Uploaded just now</p>
						</div>

						<Button type="button" variant="outline" onClick={() => onRemoveFile(file)}>
							Remove
						</Button>

						<Button type="button" onClick={() => handleOpenFile(file)}>
							Open
						</Button>
					</div>
				))}
			</div>

			<input
				ref={fileInputRef}
				type="file"
				multiple
				accept="image/jpeg,image/png,application/pdf"
				className="sr-only"
				onChange={onFilesSelected}
			/>

			<Button
				type="button"
				variant="outline"
				className="w-max"
				onClick={() => fileInputRef.current?.click()}
			>
				<RiAddLine className="size-5" aria-hidden="true" />
				Add files
			</Button>
		</>
	);
}
