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
import { RefObject, useRef, useState } from "react";
import { RiCloseLine, RiErrorWarningFill, RiLoaderLine } from "@remixicon/react";

export function AddNewPatientClient() {
	const { files, clearFile, retryUpload, uploadError, setUploadError, handleFiles } =
		useFileUpload();
	const { fileExtractions, extractError, setExtractError, extractInfo, isExtracting } =
		useFileExtraction(files);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dropzoneRef = useRef<HTMLDivElement>(null);
	const [isDropzoneActive, setIsDropzoneActive] = useState(false);
	const uploadErrorId = "upload-error-message";
	const extractErrorId = "extract-error-message";
	const allExtractionsFailed =
		files.length > 0 &&
		files.every((file) => fileExtractions[file.clientId]?.status === "extract-failed");
	const showExtractionError = files.length > 0 && Boolean(extractError);

	async function selectFiles(incomingFiles: File[]) {
		setExtractError("");
		await handleFiles(incomingFiles);
	}

	const clear = async (id?: string) => {
		if (!id) return;
		setExtractError("");
		const extraction = fileExtractions[id];
		await clearFile(
			id,
			extraction?.status === "extract-failed" ? extraction.extractionId : undefined,
		);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<main
			ref={dropzoneRef}
			className={cn(
				"relative mx-auto flex w-full max-w-[34.25rem] flex-col gap-9 px-6 pt-12 pb-28 md:max-w-[31.25rem] md:px-0",
				allExtractionsFailed && "gap-6 pt-12 md:pt-24",
			)}
			onDragEnter={(e) => {
				e.preventDefault();
				if (isExtracting) return;
				setIsDropzoneActive(true);
			}}
			onDragOver={(e) => {
				e.preventDefault();
				if (isExtracting) return;
				setIsDropzoneActive(true);
			}}
			onDragLeave={(e) => {
				e.preventDefault();
				if (!dropzoneRef.current?.contains(e.relatedTarget as Node)) {
					setIsDropzoneActive(false);
				}
			}}
			onDrop={async (e) => {
				e.preventDefault();
				if (isExtracting) return;
				setIsDropzoneActive(false);
				await selectFiles(Array.from(e.dataTransfer.files));
			}}
		>
			<div
				className={cn(
					"pointer-events-none fixed inset-0 z-100 flex items-center justify-center bg-white/80 transition-opacity",
					isDropzoneActive ? "opacity-100" : "opacity-0",
				)}
				aria-hidden={!isDropzoneActive}
			>
				<div className="px-5 py-4 text-center">
					<p className="text-lg font-medium text-gray-800">Drop files here</p>
					<p className="mt-1 text-sm text-gray-500">PDF, PNG, JPG, DOCX up to 50MB</p>
				</div>
			</div>
			<header className="text-center">
				<h1 className="mb-3 text-lg leading-6 font-semibold tracking-[-0.015em] text-balance">
					Upload Patient’s Record
				</h1>
				<p className="text-sm leading-[1.4] tracking-[-0.02em] text-gray-600 text-pretty">
					Upload a document with the patient’s basic details to create their profile. Only essential
					personal information is needed at this stage. Upload one document per patient.
				</p>
			</header>
			<div className={cn("flex flex-col gap-4", allExtractionsFailed && "gap-6")}>
				{showExtractionError ? (
					<div
						key={extractError}
						ref={(banner) => banner?.scrollIntoView({ behavior: "smooth", block: "center" })}
						id={extractErrorId}
						role="alert"
						className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-3 text-left text-sm font-medium text-red-700"
					>
						<RiErrorWarningFill className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<p className="font-semibold">Extraction failed</p>
							<p className="font-normal">{extractError}</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="ml-auto -my-1 size-6 rounded-full text-red-700 hover:bg-red-100 hover:text-red-700"
							aria-label="Dismiss extraction error"
							onClick={() => setExtractError("")}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</div>
				) : null}
				{uploadError ? (
					<div
						key={uploadError}
						ref={(banner) => banner?.scrollIntoView({ behavior: "smooth", block: "center" })}
						id={uploadErrorId}
						role="alert"
						aria-live="assertive"
						aria-atomic="true"
						className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-3 text-left text-sm font-medium text-red-700"
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
				{files.length > 0 ? (
					<div className={cn("flex flex-col gap-3", allExtractionsFailed && "gap-5")}>
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
									disabled={fileExtractions[file.clientId]?.status === "extracting"}
									onRetry={async (clientId) => {
										if (fileExtractions[clientId]?.status === "extract-failed") {
											await extractInfo([clientId]);
										} else {
											setExtractError("");
											await retryUpload(clientId);
										}
									}}
								/>
							);
						})}
					</div>
				) : (
					<ChooseFileCard
						onFilesSelected={async (event) => {
							const lists = event.target.files;
							if (!lists || lists.length === 0) {
								return;
							}
							const incomingFiles = Array.from(lists);
							event.target.value = "";
							await selectFiles(incomingFiles);
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
			</div>
			<Footer
				fileInputRef={fileInputRef}
				uploadError={uploadError}
				setUploadError={setUploadError}
				handleFiles={selectFiles}
				files={files}
				fileExtractions={fileExtractions}
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
	extractInfo,
	isExtracting,
}: {
	fileInputRef: RefObject<HTMLInputElement | null>;
	uploadError: string;
	setUploadError: (msg: string) => void;
	handleFiles: (incomingFiles: File[]) => Promise<void>;
	files: SelectedFile[];
	fileExtractions: Partial<Record<string, FileExtractionState>>;
	extractInfo: (fileIds?: string[]) => Promise<void>;
	isExtracting: boolean;
}) {
	const uploadErrorId = "upload-error-message";
	const uploadComplete =
		files.length > 0 && files.every((file) => file.status === "upload-complete");
	const extractionStarted = files.some((file) => fileExtractions[file.clientId] !== undefined);
	const isFailedExtract = files.some(
		(file) => fileExtractions[file.clientId]?.status === "extract-failed",
	);

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
		<footer
			className={cn(
				"fixed z-50 bottom-0 left-0 right-0 flex min-h-14 items-center justify-center border-t border-gray-100 bg-white px-6",
				isFailedExtract && "py-4",
			)}
		>
			{!isExtracting && !isFailedExtract ? (
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
								onChange={async (e) => {
									setUploadError("");
									const lists = e.target.files;
									if (!lists || lists.length === 0) {
										return;
									}
									const incomingFiles = Array.from(lists);
									e.target.value = "";
									await handleFiles(incomingFiles);
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
							<DialogHeader>
								<DialogTitle>Confirm extraction</DialogTitle>
								<DialogClose asChild>
									<Button variant="ghost" size="icon" aria-label="Close extraction confirmation">
										<RiCloseLine aria-hidden="true" />
									</Button>
								</DialogClose>
							</DialogHeader>
							<DialogDescription className="p-4 text-sm text-pretty">
								We’ll extract patient details from these files. Review them before saving.
							</DialogDescription>
							<DialogFooter className="sm:justify-end">
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
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			) : null}

			{isExtracting && !isFailedExtract ? (
				<div className="flex items-center gap-2">
					<RiLoaderLine className="size-4 animate-spin" /> <span>Extracting patient data...</span>
				</div>
			) : null}

			{isFailedExtract && (
				<Button
					onClick={retryExtraction}
					disabled={files.some((file) => file.status === "deleting")}
					className="w-full max-w-[31.25rem] rounded-lg bg-[#222530] hover:bg-[#222530]/90"
				>
					Retry all
				</Button>
			)}
		</footer>
	);
}
