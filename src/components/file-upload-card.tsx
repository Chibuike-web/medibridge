"use client";

import CloseLine from "@/icons/close-line";
import LoaderLine from "@/icons/loader-line";
import Image from "next/image";
import pdfFileFormat from "@/assets/file-formats/pdf.svg";
import pngFileFormat from "@/assets/file-formats/png.svg";
import jpgFileFormat from "@/assets/file-formats/jpg.svg";
import docFileFormat from "@/assets/file-formats/doc.svg";

import { formatFileSize } from "@/lib/utils";
import { FileExtensionType } from "@/hooks/use-file-upload";

type FileUploadCardProps = {
	file: File | null;
	onClear: () => void;
	uploadType: FileExtensionType;
	uploadError: string;
	isLoading: boolean;
};

export default function FileUploadCard({
	file,
	onClear,
	uploadType,
	uploadError,
	isLoading,
}: FileUploadCardProps) {
	if (!file) return null;
	const fileFormat: Record<string, string> = {
		pdf: pdfFileFormat,
		jpg: jpgFileFormat,
		png: pngFileFormat,
		doc: docFileFormat,
	};

	return (
		<div className="flex flex-col px-[14px] py-4 border border-gray-200 rounded-[8px]">
			<div className="flex items-center gap-2">
				<Image src={fileFormat[uploadType]} alt="" width={40} height={40} />
				<div className="flex w-full items-start justify-between">
					<div>
						<p className="text-[14px] font-semibold">{file.name}</p>
						<div className="flex items-center gap-1 text-[12px]">
							<div className="flex ">
								<p>{formatFileSize(file.size)}</p> <span>.</span>
							</div>
							<div className="flex items-center gap-1">
								<LoaderLine className="size-4 text-blue-500" />
								<p>Uploading...</p>
							</div>
						</div>
					</div>
					<button onClick={onClear}>
						<CloseLine className="size-5" />
					</button>
				</div>
			</div>
			<div></div>
		</div>
	);
}
