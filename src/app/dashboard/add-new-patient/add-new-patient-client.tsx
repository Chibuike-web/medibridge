"use client";

import { ChooseFileCard } from "@/components/choose-file-card";
import { FileUploadCard } from "@/components/file-upload-card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useFileParse } from "@/hooks/use-file-parse";
import { useFileUpload } from "@/hooks/use-file-upload";
import { CloseLine } from "@/icons/close-line";
import { ErrorWarningLine } from "@/icons/error-warning-line";
import { cn } from "@/lib/utils/cn";
import { RefObject, useRef } from "react";

export function AddNewPatientClient() {
	const {
		selectedFiles: files,
		clearFile,
		uploadError,
		setUploadError,
		uploadSelectedFiles,
	} = useFileUpload();
	const { parseStatus, setParseStatus } = useFileParse();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const uploadErrorId = "upload-error-message";
	const parseErrorId = "parse-error-message";

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
					</>
				) : (
					<ChooseFileCard handleFileChange={uploadSelectedFiles} fileInputRef={fileInputRef} />
				)}
				{uploadError ? (
					<div
						id={uploadErrorId}
						role="alert"
						aria-live="assertive"
						aria-atomic="true"
						className="mt-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-700"
					>
						<ErrorWarningLine className="mt-0.5 h-4 w-4 shrink-0" />
						<p className="text-sm font-medium">{uploadError}</p>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="ml-auto h-6 w-6 shrink-0 rounded-full text-red-700 hover:bg-red-100 hover:text-red-700"
							aria-label="Dismiss upload error"
							onClick={() => setUploadError("")}
						>
							<CloseLine className="h-3.5 w-3.5" />
						</Button>
					</div>
				) : null}
				{files.length > 0 && parseStatus === "error" ? (
					<div
						id={parseErrorId}
						role="alert"
						aria-live="assertive"
						aria-atomic="true"
						className="mt-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-700"
					>
						<ErrorWarningLine className="mt-0.5 h-4 w-4 shrink-0" />
						<p className="text-sm font-medium">Issue parsing file{files.length > 1 ? "s" : null}</p>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="ml-auto h-6 w-6 shrink-0 rounded-full text-red-700 hover:bg-red-100 hover:text-red-700"
							aria-label="Dismiss parse error"
							onClick={() => setParseStatus("idle")}
						>
							<CloseLine className="h-3.5 w-3.5" />
						</Button>
					</div>
				) : null}
			</div>
			<Footer fileInputRef={fileInputRef} />
		</>
	);
}
function Footer({ fileInputRef }: { fileInputRef: RefObject<HTMLInputElement | null> }) {
	const { uploadError, setUploadError, uploadSelectedFiles, selectedFiles } = useFileUpload();
	const { setParseStatus, parseFile } = useFileParse();

	const uploadErrorId = "upload-error-message";

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
							aria-invalid={Boolean(uploadError)}
							aria-describedby={uploadError ? uploadErrorId : undefined}
							onChange={(e) => {
								setUploadError("");
								uploadSelectedFiles(e);
							}}
							multiple
						/>
						<span>Upload More</span>
					</label>
				</Button>

				<Dialog>
					<DialogTrigger asChild>
						<Button disabled={selectedFiles.length === 0} className="h-11">
							Parse Document
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader className="h-16 px-6 border-b border-gray-200">
							<DialogTitle className="text-[20px] font-semibold">
								Confirm Transfer Request
							</DialogTitle>
							<DialogClose>
								<CloseLine className="size-6" />
							</DialogClose>
						</DialogHeader>
						<div className="mt-8 px-6">
							<p className="text-gray-600 font-medium">
								Please ensure all required patient records are uploaded and correct.Once parsing
								starts, additional files cannot be added and the process cannot be paused or
								restarted.
							</p>
						</div>
						<DialogFooter className="mt-16 border-t border-gray-200">
							<div className="flex gap-4 ml-auto">
								<DialogClose asChild>
									<Button variant="outline" className="h-11">
										Cancel
									</Button>
								</DialogClose>
								<DialogClose asChild>
									<Button
										className="h-11"
										onClick={() => {
											parseFile();
											setParseStatus("parsing");
										}}
									>
										Start Parsing
									</Button>
								</DialogClose>
							</div>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</footer>
	);
}
