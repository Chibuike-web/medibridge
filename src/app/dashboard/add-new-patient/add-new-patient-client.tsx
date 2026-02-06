"use client";

import { ChooseFileCard } from "@/components/choose-file-card";
import { FileUploadCard } from "@/components/file-upload-card";
import { Button } from "@/components/ui/button";
import { useFileParse } from "@/hooks/use-file-parse";
import { useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils/cn";
import { ChangeEvent, RefObject, useRef } from "react";

export function AddNewPatientClient() {
	const { selectedFiles: files, clearFile, uploadError, uploadSelectedFiles } = useFileUpload();
	const { parseStatus, setParseStatus } = useFileParse();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const clear = (id?: string) => {
		if (!id) return;
		setParseStatus("idle");
		clearFile(id);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};
	return (
		<>
			<div className="pb-40">
				{files.length > 0 ? (
					<>
						<div
							className={cn(
								"flex flex-col gap-3",
								parseStatus === "parsing" && "opacity-50 cursor-not-allowed",
							)}
						>
							{files.map((file) => (
								<FileUploadCard
									key={file.id}
									file={file.file}
									extension={file.extension}
									id={file.id}
									status={file.status}
									onRemove={clear}
								/>
							))}
						</div>
						{uploadError ? (
							<p className="text-red-500 text-sm mt-2 text-pretty">{uploadError}</p>
						) : null}
					</>
				) : (
					<ChooseFileCard handleFileChange={uploadSelectedFiles} fileInputRef={fileInputRef} />
				)}
				{files.length > 0 && parseStatus === "error" ? (
					<p className="text-red-500 font-medium mt-2 text-pretty">
						Issue parsing file{files.length > 1 ? "s" : null}
					</p>
				) : null}
			</div>
			<Footer fileInputRef={fileInputRef} handleFileChange={uploadSelectedFiles} />
		</>
	);
}

function Footer({
	handleFileChange,
	fileInputRef,
}: {
	handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
	fileInputRef: RefObject<HTMLInputElement | null>;
}) {
	const { setParseStatus, parseFile } = useFileParse();
	return (
		<footer className="fixed z-50 bottom-0 left-0 right-0 flex items-center justify-center border-t h-20 border-gray-200 pb-[env(safe-area-inset-bottom)] bg-white">
			<div className="flex w-full justify-between items-center max-w-xl">
				<Button type="button" variant="outline" className="h-11">
					<label htmlFor="file-input">
						<input
							type="file"
							className="sr-only"
							id="file-input"
							ref={fileInputRef}
							onChange={handleFileChange}
							multiple
						/>
						<span> Upload More</span>
					</label>
				</Button>

				<Button
					className="h-11"
					onClick={() => {
						parseFile();
						setParseStatus("parsing");
					}}
				>
					Parse Document
				</Button>
			</div>
		</footer>
	);
}
