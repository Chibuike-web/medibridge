"use client";

import { deletePatientUploadAction } from "@/features/patients/server/delete-patient-upload-action";
import { removeExtractionDocumentAction } from "@/features/patients/server/remove-extraction-document-action";
import { SavedFileTypes, SelectedFile } from "@/lib/types/upload";
import { startTransition, useRef, useState } from "react";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

type UploadFileResponse =
	| {
			status: "success";
			files: (
				| Extract<SavedFileTypes, { status: "upload-failed" }>
				| (Extract<SavedFileTypes, { status: "upload-complete" }> & { signedUrl: string })
			)[];
	  }
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
			const response = await fetch("/api/file-upload", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					files: [
						{
							clientId,
							name: failedFile.browserFile.name,
							size: failedFile.browserFile.size,
							type: failedFile.browserFile.type || "application/octet-stream",
						},
					],
				}),
			});
			const data: UploadFileResponse = await response.json();
			const grant =
				data.status === "success"
					? data.files.find((file) => file.clientId === clientId)
					: undefined;
			let uploadedFile: SavedFileTypes | undefined;
			if (response.ok && grant?.status === "upload-complete") {
				const upload = await fetch(grant.signedUrl, {
					method: "PUT",
					headers: { "Content-Type": grant.type, "x-upsert": "false" },
					body: failedFile.browserFile,
				});
				if (upload.ok) {
					const { signedUrl: _signedUrl, ...file } = grant;
					uploadedFile = file;
				}
			}
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
			const res = await fetch("/api/file-upload", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					files: optimisticItems.map((item) => ({
						clientId: item.clientId,
						name: item.name,
						size: item.size,
						type: item.browserFile.type || "application/octet-stream",
					})),
				}),
			});
			const data: UploadFileResponse = await res.json();
			if (!res.ok || data.status !== "success") {
				setUploadError(
					data.status === "failed"
						? data.error
						: "We couldn’t upload these files. Please try again.",
				);
				setFiles((prev) =>
					prev.map<SelectedFile>((file) =>
						optimisticItems.some((item) => item.clientId === file.clientId)
							? { ...file, status: "upload-failed" }
							: file,
					),
				);
				return;
			}
			const uploadedFiles: SavedFileTypes[] = await Promise.all(
				optimisticItems.map(async (item): Promise<SavedFileTypes> => {
					const grant = data.files.find((file) => file.clientId === item.clientId);
					try {
						if (grant?.status !== "upload-complete")
							throw new Error("Missing upload authorization.");
						const upload = await fetch(grant.signedUrl, {
							method: "PUT",
							headers: { "Content-Type": grant.type, "x-upsert": "false" },
							body: item.browserFile,
						});
						if (!upload.ok) throw new Error("Storage rejected upload.");
						const { signedUrl: _signedUrl, ...file } = grant;
						return file;
					} catch {
						return { clientId: item.clientId, name: item.name, status: "upload-failed" };
					}
				}),
			);
			if (uploadedFiles.some((file) => file.status === "upload-failed"))
				setUploadError("Some files couldn’t upload. Retry the failed files.");

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
