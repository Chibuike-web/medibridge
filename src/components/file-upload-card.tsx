import { CloseLine } from "@/icons/close-line";
import { LoaderLine } from "@/icons/loader-line";
import Image from "next/image";
import pdfFileFormat from "@/assets/file-formats/pdf.svg";
import pngFileFormat from "@/assets/file-formats/png.svg";
import jpgFileFormat from "@/assets/file-formats/jpg.svg";
import docFileFormat from "@/assets/file-formats/doc.svg";
import { cn } from "@/lib/utils/cn";
import { CheckCircle } from "@/icons/check-circle";
import { DeleteBinLine } from "@/icons/delete-bin-line";
import { ErrorWarningFill } from "../icons/error-warning-fill";
import { formatFileSize } from "@/lib/utils/format-file-size";
import { AllowedFileExtension, UploadStatus } from "@/store/use-upload-store";

type FileUploadCardProps = {
	id?: string;
	file: File;
	extension: AllowedFileExtension;
	status: UploadStatus;
	onRemove: (id?: string) => void;
};

export function FileUploadCard({ file, extension, status, id, onRemove }: FileUploadCardProps) {
	if (!file) return;

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
				"flex flex-col px-3.5 py-4 border border-gray-200 rounded-[8px]",
				status === "failed" && "border-red-500",
			)}
		>
			<div className="flex items-center gap-2">
				<Image src={fileFormat[extension]} alt="" width={40} height={40} />
				<div className="flex w-full items-start justify-between">
					<div>
						<p className="text-[14px] font-semibold">{file.name}</p>
						<div className="flex items-center gap-1 text-[12px]">
							<div className="flex items-center gap-1 ">
								<p>{formatFileSize(file.size)}</p>
								<span className="size-0.5 block bg-foreground rounded-full" />
							</div>
							<div className="flex items-center gap-1">
								{status === "uploading" ? (
									<LoaderLine className="size-4 text-blue-500 animate-spin " />
								) : status === "completed" ? (
									<CheckCircle className="size-4 text-green-500" />
								) : status === "failed" ? (
									<ErrorWarningFill className="size-4 text-red-500" />
								) : null}
								{status === "uploading" ? (
									<p>Uploading...</p>
								) : status === "completed" ? (
									<p>Completed</p>
								) : status === "failed" ? (
									<p>Failed</p>
								) : null}
							</div>
						</div>
					</div>
					<button
						onClick={() => {
							if (id) {
								onRemove(id);
							} else {
								onRemove();
							}
						}}
					>
						{status === "uploading" ? (
							<CloseLine className="size-5" />
						) : (
							<DeleteBinLine className="size-5" />
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
