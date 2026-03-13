import { CloseLine } from "@/icons/close-line";
import { LoaderLine } from "@/icons/loader-line";
import Image from "next/image";
import pdfFileFormat from "@/assets/file-formats/pdf.svg";
import pngFileFormat from "@/assets/file-formats/png.svg";
import jpgFileFormat from "@/assets/file-formats/jpg.svg";
import docFileFormat from "@/assets/file-formats/doc.svg";
import { cn } from "@/lib/utils/cn";
import { CheckCircle } from "@/icons/check-circle";
import { ErrorWarningFill } from "../icons/error-warning-fill";
import { formatFileSize } from "@/lib/utils/format-file-size";
import { AllowedFileExtension, FileStatus } from "@/types/upload";
import { Button } from "./ui/button";
import { DeleteBinLine } from "@/icons/delete-bin-line";

type FileUploadCardProps = {
	id?: string;
	name: string;
	size: number;
	extension: AllowedFileExtension;
	status: FileStatus;
	onRemove: (id?: string) => void | Promise<void>;
};

export function FileUploadCard({
	name,
	size,
	extension,
	status,
	id,
	onRemove,
}: FileUploadCardProps) {
	const fileFormat: Record<string, string> = {
		pdf: pdfFileFormat,
		jpg: jpgFileFormat,
		png: pngFileFormat,
		doc: docFileFormat,
		docx: docFileFormat,
	};

	return (
		<div
			className={cn(
				"flex flex-col px-3.5 py-4 border border-gray-200 rounded-lg",
				status === "extract-failed" && "border-red-500",
				status === "deleting" && "opacity-50",
			)}
		>
			<div className="flex items-center gap-2">
				<Image src={fileFormat[extension]} alt="" width={40} height={40} />
				<div className="flex w-full items-start justify-between gap-1.5">
					<div>
						<p className="text-sm font-semibold">{name}</p>
						<div className="flex items-center gap-1 text-xs">
							<div className="flex items-center gap-1 ">
								<p>{formatFileSize(size)}</p>
								<span className="size-0.5 block bg-foreground rounded-full" />
							</div>
							<div className="flex items-center gap-1">
								{status === "uploading" || status === "deleting" || status === "extracting" ? (
									<LoaderLine className="size-4 text-blue-500 animate-spin" />
								) : status === "upload-complete" || status === "extract-complete" ? (
									<CheckCircle className="size-4 text-green-500" />
								) : status === "extract-failed" ? (
									<ErrorWarningFill className="size-4 text-red-500" />
								) : null}
								{status === "idle" ? (
									<p>Ready</p>
								) : status === "uploading" ? (
									<p>Uploading...</p>
								) : status === "extracting" ? (
									<p>Extracting...</p>
								) : status === "deleting" ? (
									<p>Deleting...</p>
								) : status === "upload-complete" ? (
									<p>Upload complete</p>
								) : status === "extract-complete" ? (
									<p>Extraction complete</p>
								) : status === "extract-failed" ? (
									<p>Extraction failed</p>
								) : null}
							</div>
						</div>
					</div>

					<Button
						variant="ghost"
						className="has-[>svg]:px-0 py-0 h-max"
						disabled={
							status === "deleting" || status === "extract-complete" || status === "uploading"
						}
						onClick={() => {
							if (id) {
								void onRemove(id);
							} else {
								void onRemove();
							}
						}}
					>
						{status === "uploading" ? (
							<CloseLine className="size-5" />
						) : (
							<DeleteBinLine className="size-5" />
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}

