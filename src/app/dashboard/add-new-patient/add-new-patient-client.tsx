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
import { useFileUpload } from "@/hooks/use-file-upload";
import { CloseLine } from "@/icons/close-line";
import { ErrorWarningLine } from "@/icons/error-warning-line";
import { LoaderLine } from "@/icons/loader-line";
import { cn } from "@/lib/utils/cn";
import { AllowedFileExtension, SelectedFile } from "@/types/upload";
import Link from "next/link";
import { RefObject, useRef, useState } from "react";

export function AddNewPatientClient() {
	const {
		files,
		clearFile,
		uploadError,
		extractError,
		setUploadError,
		setExtractError,
		handleFiles,
		extractInfo,
	} = useFileUpload();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dropzoneRef = useRef<HTMLDivElement>(null);
	const [active, setActive] = useState(false);
	const uploadErrorId = "upload-error-message";
	const extractErrorId = "extract-error-message";
	const isExtracting = files.some((f) => f.status === "extracting");

	const clear = async (id?: string) => {
		if (!id) return;
		await clearFile(id);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<main
			ref={dropzoneRef}
			className="relative pb-40"
			onDragEnter={(e) => {
				e.preventDefault();
				if (isExtracting) return;
				setActive(true);
			}}
			onDragOver={(e) => {
				e.preventDefault();
				setActive(true);
			}}
			onDragLeave={(e) => {
				e.preventDefault();
				if (!dropzoneRef.current?.contains(e.relatedTarget as Node)) {
					setActive(false);
				}
			}}
			onDrop={(e) => {
				e.preventDefault();
				if (isExtracting) return;
				setActive(false);
				handleFiles(Array.from(e.dataTransfer.files));
			}}
		>
			<div
				className={cn(
					"pointer-events-none fixed inset-0 z-100 flex items-center justify-center bg-white/80 transition-opacity",
					active ? "opacity-100" : "opacity-0",
				)}
				aria-hidden={!active}
			>
				<div className="px-5 py-4 text-center">
					<p className="text-2xl font-medium text-gray-900">Drop files here</p>
					<p className="mt-1 text-base text-gray-500">PDF, PNG, JPG, DOC, DOCX up to 50MB</p>
				</div>
			</div>
			<div>
				{files.length > 0 ? (
					<div
						className={cn("flex flex-col gap-3", isExtracting && "opacity-50 cursor-not-allowed")}
					>
						{files.map((file) => {
							const extension = file.name.split(".").pop()?.toLowerCase() as AllowedFileExtension;

							return (
								<FileUploadCard
									key={file.id}
									name={file.name}
									size={file.size}
									extension={extension}
									id={file.id}
									status={file.status}
									onRemove={clear}
								/>
							);
						})}
					</div>
				) : (
					<ChooseFileCard
						handleFileChange={(e) => {
							const lists = e.target.files;
							if (!lists || lists.length === 0) {
								return;
							}
							handleFiles(Array.from(lists));
							e.target.value = "";
						}}
						fileInputRef={fileInputRef}
					/>
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
				{extractError ? (
					<div
						id={extractErrorId}
						role="alert"
						aria-live="assertive"
						aria-atomic="true"
						className="mt-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-700"
					>
						<ErrorWarningLine className="mt-0.5 h-4 w-4 shrink-0" />
						<p className="text-sm font-medium">{extractError}</p>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="ml-auto h-6 w-6 shrink-0 rounded-full text-red-700 hover:bg-red-100 hover:text-red-700"
							aria-label="Dismiss extract error"
							onClick={() => {
								setExtractError("");
							}}
						>
							<CloseLine className="h-3.5 w-3.5" />
						</Button>
					</div>
				) : null}
			</div>
			<Footer
				fileInputRef={fileInputRef}
				uploadError={uploadError}
				setUploadError={setUploadError}
				handleFiles={handleFiles}
				files={files}
				extractInfo={extractInfo}
				isExtracting={isExtracting}
			/>
		</main>
	);
}

function Footer({
	fileInputRef,
	uploadError,
	setUploadError,
	handleFiles,
	files,
	extractInfo,
	isExtracting,
}: {
	fileInputRef: RefObject<HTMLInputElement | null>;
	uploadError: string;
	setUploadError: (msg: string) => void;
	handleFiles: (incomingFiles: File[]) => void;
	files: SelectedFile[];
	extractInfo: (filenames?: string[]) => Promise<void>;
	isExtracting: boolean;
}) {
	const uploadErrorId = "upload-error-message";
	const uploadComplete =
		files.length > 0 && files.every((file) => file.status === "upload-complete");
	const extractionComplete =
		files.length > 0 &&
		files.every((file) => file.status === "extract-complete" || file.status === "extract-failed");
	const isFailedExtract = files.some((file) => file.status === "extract-failed");

	function retryExtraction() {
		const failedFiles = files.filter((f) => f.status === "extract-failed").map((f) => f.name);
		if (failedFiles.length === 0) return;

		void extractInfo(failedFiles);
	}

	return (
		<footer className="fixed z-50 bottom-0 left-0 right-0 flex items-center justify-center border-t h-20 border-gray-200 bg-white px-4 md:px-0">
			{!isExtracting && !extractionComplete ? (
				<div className="flex w-full justify-between items-center max-w-[600px]">
					<Button type="button" variant="outline" className="h-11" disabled={!uploadComplete}>
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
									const lists = e.target.files;
									if (!lists || lists.length === 0) {
										return;
									}
									handleFiles(Array.from(lists));
									e.target.value = "";
								}}
								multiple
							/>
							<span>Upload More</span>
						</label>
					</Button>

					<Dialog>
						<DialogTrigger asChild>
							<Button disabled={!uploadComplete || isExtracting} className="h-11">
								Extract Information
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
									Please ensure all required patient records are uploaded and correct. Once
									extraction starts, additional files cannot be added and the process cannot be
									paused or restarted.
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
												void extractInfo();
											}}
										>
											Start Extraction
										</Button>
									</DialogClose>
								</div>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			) : null}

			{isExtracting ? (
				<div className="flex items-center gap-2">
					<LoaderLine className="size-4 animate-spin" /> <span>Extracting patient data...</span>
				</div>
			) : null}

			{extractionComplete && !isFailedExtract && (
				<Button className="h-11 w-xl" asChild>
					<Link href="/dashboard/review-extracted-info">Continue</Link>
				</Button>
			)}

			{isFailedExtract && (
				<Button onClick={retryExtraction} variant="outline" className="w-xl">
					Try again
				</Button>
			)}
		</footer>
	);
}
