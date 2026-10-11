"use client";

import { ChooseFileCard } from "@/components/choose-file-card";
import { FileUploadCard } from "@/components/file-upload-card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useFileExtraction } from "@/hooks/use-file-extraction";
import { cn } from "@/lib/utils/cn";
import type { AllowedFileExtension, FileExtractionState, SelectedFile } from "@/lib/types/upload";
import Link from "next/link";
import { RefObject, useRef, useState } from "react";
import { RiCloseLine, RiErrorWarningFill, RiLoaderLine } from "@remixicon/react";

export function AddNewPatientClient() {
	const { files, clearFile, retryUpload, uploadError, setUploadError, handleFiles } =
		useFileUpload();
	const {
		fileExtractions,
		extractionIds,
		extractError,
		setExtractError,
		extractInfo,
		isExtracting,
	} = useFileExtraction(files);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dropzoneRef = useRef<HTMLDivElement>(null);
	const [active, setActive] = useState(false);
	const uploadErrorId = "upload-error-message";
	const extractErrorId = "extract-error-message";

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
					<p className="text-lg font-medium text-gray-800">Drop files here</p>
					<p className="mt-1 text-sm text-gray-500">PDF, PNG, JPG, DOCX up to 50MB</p>
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
									key={file.clientId}
									name={file.name}
									size={file.size}
									extension={extension}
									id={file.clientId}
									uploadStatus={file.status}
									extractionStatus={fileExtractions[file.clientId]?.status}
									onRemove={clear}
									onRetry={retryUpload}
								/>
							);
						})}
					</div>
				) : (
					<ChooseFileCard
						onFilesSelected={(event) => {
							const lists = event.target.files;
							if (!lists || lists.length === 0) {
								return;
							}
							handleFiles(Array.from(lists));
							event.target.value = "";
						}}
						fileInputRef={fileInputRef}
						title="Choose files or drag and drop them here."
						description="PDF, PNG, JPG, and DOCX, up to 50 MB."
						browseLabel="Browse files"
						inputId="patient-record-files"
						accept="application/pdf,image/png,image/jpeg,.docx"
						multiple
						error={uploadError}
					/>
				)}
				{uploadError ? (
					<div
						id={uploadErrorId}
						role="alert"
						aria-live="assertive"
						aria-atomic="true"
						className="mt-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-3 text-left text-sm font-medium text-red-700"
					>
						<RiErrorWarningFill className="size-4 shrink-0" aria-hidden="true" />
						<span className="min-w-0 flex-1">{uploadError}</span>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="ml-auto -my-1 size-6 rounded-full text-red-700 hover:bg-red-100 hover:text-red-700"
							aria-label="Dismiss upload error"
							onClick={() => setUploadError("")}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</div>
				) : null}
				{extractError ? (
					<div
						id={extractErrorId}
						role="alert"
						aria-live="assertive"
						aria-atomic="true"
						className="mt-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-3 text-left text-sm font-medium text-red-700"
					>
						<RiErrorWarningFill className="size-4 shrink-0" aria-hidden="true" />
						<span className="min-w-0 flex-1">{extractError}</span>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="ml-auto -my-1 size-6 rounded-full text-red-700 hover:bg-red-100 hover:text-red-700"
							aria-label="Dismiss extract error"
							onClick={() => {
								setExtractError("");
							}}
						>
							<RiCloseLine aria-hidden="true" />
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
				fileExtractions={fileExtractions}
				extractionIds={extractionIds}
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
	fileExtractions,
	extractionIds,
	extractInfo,
	isExtracting,
}: {
	fileInputRef: RefObject<HTMLInputElement | null>;
	uploadError: string;
	setUploadError: (msg: string) => void;
	handleFiles: (incomingFiles: File[]) => void;
	files: SelectedFile[];
	fileExtractions: Partial<Record<string, FileExtractionState>>;
	extractionIds: string[];
	extractInfo: (fileIds?: string[]) => Promise<void>;
	isExtracting: boolean;
}) {
	const uploadErrorId = "upload-error-message";
	const uploadComplete =
		files.length > 0 && files.every((file) => file.status === "upload-complete");
	const extractionStarted = files.some((file) => fileExtractions[file.clientId] !== undefined);
	const extractionComplete =
		files.length > 0 &&
		files.every(
			(file) =>
				file.status === "upload-complete" &&
				(fileExtractions[file.clientId]?.status === "extract-complete" ||
					fileExtractions[file.clientId]?.status === "extract-failed"),
		);
	const isFailedExtract = files.some(
		(file) =>
			file.status === "upload-complete" &&
			fileExtractions[file.clientId]?.status === "extract-failed",
	);
	const reviewSearchParams = new URLSearchParams();
	for (const extractionId of extractionIds) {
		reviewSearchParams.append("extractionId", extractionId);
	}

	async function retryExtraction() {
		const failedFileIds = files
			.filter(
				(file) =>
					file.status === "upload-complete" &&
					fileExtractions[file.clientId]?.status === "extract-failed",
			)
			.map((file) => file.clientId);
		if (failedFileIds.length === 0) return;

		await extractInfo(failedFileIds);
	}

	return (
		<footer className="fixed z-50 bottom-0 left-0 right-0 flex min-h-14 items-center justify-center border-t border-gray-200 bg-white px-6">
			{!isExtracting && !extractionComplete ? (
				<div className="flex w-full justify-between items-center max-w-[31.25rem]">
					<Button type="button" variant="outline" disabled={!uploadComplete || extractionStarted}>
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
							<Button disabled={!uploadComplete || extractionStarted || isExtracting}>
								Extract Information
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader className="py-4">
								<DialogTitle>Confirm Extraction</DialogTitle>
								<DialogDescription className="sr-only">
									Confirm that the uploaded patients are complete before starting extraction.
								</DialogDescription>
								<DialogClose>
									<RiCloseLine className="size-6" />
								</DialogClose>
							</DialogHeader>
							<div className="px-4 py-5 text-sm">
								<p className="text-gray-600 font-normal">
									Please ensure all required patients are uploaded and correct. Once extraction
									starts, additional files cannot be added and the process cannot be paused or
									restarted.
								</p>
							</div>
							<DialogFooter className="mt-16 text-sm">
								<div className="flex gap-2 ml-auto">
									<DialogClose asChild>
										<Button variant="outline">Cancel</Button>
									</DialogClose>
									<DialogClose asChild>
										<Button
											onClick={async () => {
												await extractInfo();
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
					<RiLoaderLine className="size-4 animate-spin" /> <span>Extracting patient data...</span>
				</div>
			) : null}

			{extractionComplete && !isFailedExtract && extractionIds.length > 0 && (
				<Button className="w-xl" asChild>
					<Link href={`/dashboard/review-extracted-info?${reviewSearchParams.toString()}`}>
						Continue
					</Link>
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
