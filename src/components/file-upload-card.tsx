import Image from "next/image";
import { useId } from "react";
import pdfFileFormat from "@/assets/file-formats/pdf.svg";
import pngFileFormat from "@/assets/file-formats/png.svg";
import jpgFileFormat from "@/assets/file-formats/jpg.svg";
import docFileFormat from "@/assets/file-formats/doc.svg";
import { cn } from "@/lib/utils/cn";
import { formatFileSize } from "@/lib/utils/format-file-size";
import type {
	AllowedFileExtension,
	FileExtractionStatus,
	FileUploadStatus,
} from "@/lib/types/upload";
import { Button } from "./ui/button";
import {
	RiCheckboxCircleFill,
	RiCloseLine,
	RiDeleteBinLine,
	RiErrorWarningFill,
	RiLoaderLine,
} from "@remixicon/react";

type FileUploadCardProps = {
	id?: string;
	name: string;
	size: number;
	extension: AllowedFileExtension;
	uploadStatus: FileUploadStatus;
	extractionStatus?: FileExtractionStatus;
	onRemove: (id?: string) => void | Promise<void>;
	onRetry?: (id: string) => void | Promise<void>;
};

export function FileUploadCard({
	name,
	size,
	extension,
	uploadStatus,
	extractionStatus,
	id,
	onRemove,
	onRetry,
}: FileUploadCardProps) {
	const fileFormat: Record<string, string> = {
		pdf: pdfFileFormat,
		jpg: jpgFileFormat,
		jpeg: jpgFileFormat,
		png: pngFileFormat,
		doc: docFileFormat,
		docx: docFileFormat,
	};
	const fileNameId = useId();
	const isExtractionComplete =
		uploadStatus === "upload-complete" && extractionStatus === "extract-complete";

	return (
		<div
			className={cn(
				"flex flex-col px-3.5 py-4 border border-gray-200 rounded-xl",
				uploadStatus === "upload-complete" &&
					extractionStatus === "extract-failed" &&
					"border-red-500",
				uploadStatus === "deleting" && "opacity-50",
			)}
		>
			<div className="flex items-center gap-2">
				<Image
					src={fileFormat[extension]}
					alt=""
					width={40}
					height={40}
					className="size-8 shrink-0"
				/>
				<div className="flex min-w-0 flex-1  items-start justify-between gap-1.5">
					<div className="min-w-0">
						<p id={fileNameId} className="text-sm font-semibold truncate">{name}</p>
						<div className="flex items-center gap-1 text-xs">
							<div className="flex items-center gap-1">
								<p>{formatFileSize(size)}</p>
								{!isExtractionComplete && (
									<span className="size-0.5 block bg-foreground rounded-full" />
								)}
							</div>
							<div className="flex items-center gap-1">
								{uploadStatus === "upload-complete" && extractionStatus ? (
									extractionStatus === "extracting" ? (
										<>
											<RiLoaderLine className="size-4 text-blue-500 animate-spin" />
											<p>Extracting...</p>
										</>
									) : extractionStatus === "extract-failed" ? (
										<>
											<RiErrorWarningFill className="size-4 text-red-500" />
											<p>Extraction failed</p>
										</>
									) : null
								) : (
									<>
										{uploadStatus === "uploading" || uploadStatus === "deleting" ? (
											<RiLoaderLine className="size-4 text-blue-500 animate-spin" />
										) : uploadStatus === "upload-complete" ? (
											<RiCheckboxCircleFill className="size-4 text-green-500" />
										) : uploadStatus === "upload-failed" ? (
											<RiErrorWarningFill className="size-4 text-red-500" />
										) : null}
										{uploadStatus === "idle" ? (
											<p>Ready</p>
										) : uploadStatus === "uploading" ? (
											<p>Uploading...</p>
										) : uploadStatus === "deleting" ? (
											<p>Deleting...</p>
										) : uploadStatus === "upload-complete" ? (
											<p>Upload complete</p>
										) : uploadStatus === "upload-failed" ? (
											<p>Upload failed</p>
										) : null}
									</>
								)}
							</div>
						</div>
					</div>

					{uploadStatus === "upload-failed" ? (
						<div className="flex items-center">
							<Button
								type="button"
								variant="ghost"
								className="h-8 px-2 py-0 text-xs"
								disabled={!id || !onRetry}
								aria-describedby={fileNameId}
								onClick={async () => {
									if (id && onRetry) await onRetry(id);
								}}
							>
								Try again
							</Button>
							<Button
								type="button"
								variant="ghost"
								className="h-8 px-2 py-0 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
								aria-describedby={fileNameId}
								onClick={async () => {
									if (id) {
										await onRemove(id);
									} else {
										await onRemove();
									}
								}}
							>
								Remove
							</Button>
						</div>
					) : (
						<Button
							variant="ghost"
							size="icon"
							className="has-[>svg]:px-0 py-0"
							aria-label={uploadStatus === "uploading" ? "Cancel upload" : "Remove file"}
							aria-describedby={fileNameId}
							disabled={
								uploadStatus === "deleting" ||
								uploadStatus === "uploading" ||
								(uploadStatus === "upload-complete" &&
									(extractionStatus === "extracting" || extractionStatus === "extract-complete"))
							}
							onClick={async () => {
								if (id) {
									await onRemove(id);
								} else {
									await onRemove();
								}
							}}
						>
							{uploadStatus === "uploading" ? (
								<RiCloseLine className="size-4" aria-hidden="true" />
							) : (
								<RiDeleteBinLine className="size-4" aria-hidden="true" />
							)}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
