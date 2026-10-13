"use client";

import { deletePatientUploadAction } from "@/features/patients/server/delete-patient-upload-action";
import { removeExtractionDocumentAction } from "@/features/patients/server/remove-extraction-document-action";
import { SavedFileTypes, SelectedFile } from "@/lib/types/upload";
import { startTransition, useRef, useState } from "react";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

type UploadFileResponse =
	| { status: "success"; files: SavedFileTypes[] }
	| { status: "failed"; error: string };

export function useFileUpload() {
	const [files, setFiles] = useState<SelectedFile[]>([]);
	const [uploadError, setUploadError] = useState("");
	const pendingUploadRetriesRef = useRef(new Set<string>());

	async function retryUpload(clientId: string) {
		const failedFile = files.find(
			(file) => file.clientId === clientId && file.status === "upload-failed",
		);
		if (!failedFile || pendingUploadRetriesRef.current.has(clientId)) return;

		pendingUploadRetriesRef.current.add(clientId);
		setUploadError("");
		setFiles((prev) =>
			prev.map<SelectedFile>((file) =>
				file.clientId === clientId ? { ...file, status: "uploading" } : file,
			),
		);

		try {
			const formData = new FormData();
			formData.append("file", failedFile.browserFile);
			formData.append("clientId", clientId);

			const response = await fetch("/api/file-upload", {
				method: "POST",
				body: formData,
			});
			const data: UploadFileResponse = await response.json();
			const uploadedFile =
				data.status === "success"
					? data.files?.find((file) => file.clientId === clientId)
					: undefined;

			if (!response.ok || !uploadedFile || uploadedFile.status !== "upload-complete") {
				setUploadError(
					data.status === "failed" ? data.error : "We couldn’t upload this file. Please try again.",
				);
				setFiles((prev) =>
					prev.map<SelectedFile>((file) =>
						file.clientId === clientId ? { ...file, status: "upload-failed" } : file,
					),
				);
				return;
			}

			setFiles((prev) =>
				prev.map<SelectedFile>((file) =>
					file.clientId === clientId ? { ...file, ...uploadedFile } : file,
				),
			);
		} catch (error) {
			console.error("Retrying patient upload failed:", error);
			setUploadError("We couldn’t upload this file. Please try again.");
			setFiles((prev) =>
				prev.map<SelectedFile>((file) =>
					file.clientId === clientId ? { ...file, status: "upload-failed" } : file,
				),
			);
		} finally {
			pendingUploadRetriesRef.current.delete(clientId);
		}
	}

	async function clearFile(clientId: string, extractionId?: string) {
		const fileToDelete = files.find((file) => file.clientId === clientId);
		if (!fileToDelete || fileToDelete.status === "deleting") return;
		setUploadError("");
		if (
			fileToDelete.status === "idle" ||
			fileToDelete.status === "uploading" ||
			fileToDelete.status === "upload-failed"
		) {
			setFiles((prev) => prev.filter((file) => file.clientId !== clientId));
			return;
		}

		setFiles((prev) =>
			prev.map((file) =>
				file.clientId === clientId ? { ...fileToDelete, status: "deleting" } : file,
			),
		);

		try {
			const result = extractionId
				? await removeExtractionDocumentAction(extractionId, fileToDelete.storedName)
				: await deletePatientUploadAction(fileToDelete.url);
			if (result.status === "failed") {
				setUploadError(result.error);
				setFiles((prev) => prev.map((file) => (file.clientId === clientId ? fileToDelete : file)));
				return;
			}
			setFiles((prev) => prev.filter((file) => file.clientId !== clientId));
		} catch (error) {
			console.error("Removing patient upload failed:", error);
			setUploadError("We couldn’t remove this file. Please try again.");
			setFiles((prev) => prev.map((file) => (file.clientId === clientId ? fileToDelete : file)));
		}
	}

	const handleFiles = async (incomingFiles: File[]) => {
		setUploadError("");

		if (incomingFiles.length === 0) {
			setUploadError("Please select a valid file.");
			return;
		}

		let browserFiles = incomingFiles;

		const fileExtensions = browserFiles.map((file) => file.name.split(".").pop()?.toLowerCase());
		const allowedTypes = ["pdf", "png", "jpg", "jpeg", "docx"];

		for (const ext of fileExtensions) {
			if (!ext || !allowedTypes.includes(ext)) {
				setUploadError("Invalid file type. Only PDF, PNG, JPG, and DOCX are allowed.");
				return;
			}
		}

		for (const file of browserFiles) {
			if (file.size > MAX_FILE_SIZE_BYTES) {
				setUploadError("File is too large. Maximum allowed size is 50MB.");
				return;
			}
		}

		const duplicates = incomingFiles.filter((f) => files.some((file) => file.name === f.name));
		browserFiles = incomingFiles.filter((f) => !files.some((file) => file.name === f.name));

		if (duplicates.length > 0) {
			alert(`Skipped duplicate files: ${duplicates.map((f) => f.name).join(", ")}`);
		}

		if (browserFiles.length === 0) {
			return;
		}

		const optimisticItems: SelectedFile[] = browserFiles.map((file) => ({
			clientId: crypto.randomUUID(),
			browserFile: file,
			name: file.name,
			size: file.size,
			status: "uploading",
		}));

		startTransition(() => {
			setFiles((prev) => [...prev, ...optimisticItems]);
		});

		try {
			const formData = new FormData();
			for (const file of optimisticItems) {
				formData.append("file", file.browserFile);
				formData.append("clientId", file.clientId);
			}

			const res = await fetch("/api/file-upload", {
				method: "POST",
				body: formData,
			});
			const data = await res.json();
			if (!res.ok) {
				const error = data.error ?? "Issue uploading file";
				setUploadError(error);
				setFiles((prev) =>
					prev.map<SelectedFile>((file) =>
						optimisticItems.some((item) => item.clientId === file.clientId)
							? { ...file, status: "upload-failed" }
							: file,
					),
				);
				return;
			}

			const uploadedFiles: SavedFileTypes[] = data.files;

			startTransition(() => {
				setFiles((prev) =>
					prev.map<SelectedFile>((file) => {
						const uploadedMatch = uploadedFiles.find((item) => item.clientId === file.clientId);
						if (!uploadedMatch) return file;

						return {
							...file,
							...uploadedMatch,
						};
					}),
				);
			});
		} catch (error) {
			console.error(error);
			setUploadError("Upload failed.");
			setFiles((prev) =>
				prev.map<SelectedFile>((file) =>
					optimisticItems.some((item) => item.clientId === file.clientId)
						? {
								...file,
								status: "upload-failed",
							}
						: file,
				),
			);
		}
	};

	return {
		files,
		uploadError,
		setUploadError,
		setFiles,
		clearFile,
		retryUpload,
		handleFiles,
	};
}
