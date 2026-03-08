"use client";

import { deletePatientUploadAction } from "@/actions/delete-patient-upload-action";
import { useExtractedPatient } from "@/store/use-extracted-patient-store";
import { ExtractionResult, SelectedFile } from "@/types/upload";
import { startTransition, useState } from "react";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export function useFileUpload() {
	const [files, setFiles] = useState<SelectedFile[]>([]);
	const [uploadError, setUploadError] = useState("");
	const [extractError, setExtractError] = useState("");
	const [isExtracting, setIsExtracting] = useState(false);

	const { setPatientData } = useExtractedPatient();

	const clearFile = async (id: string) => {
		const fileToDelete = files.find((file) => file.id === id);
		if (!fileToDelete) return;

		setFiles((prev) =>
			prev.map((file) => (file.id === id ? { ...file, status: "deleting" } : file)),
		);

		if (fileToDelete.url) {
			await new Promise((r) => setTimeout(r, 5000));

			const result = await deletePatientUploadAction(fileToDelete.url);

			if (result.status === "failed") {
				setUploadError(result.error ?? "Unable to delete file.");
				setFiles((prev) =>
					prev.map((file) => (file.id === id ? { ...file, status: fileToDelete.status } : file)),
				);
				return;
			}
		}

		setFiles((prev) => prev.filter((f) => f.id !== id));
	};

	const handleFiles = async (incomingFiles: File[]) => {
		setUploadError("");
		setExtractError("");

		if (incomingFiles.length === 0) {
			setUploadError("Please select a valid file.");
			return;
		}

		let browserFiles = incomingFiles;

		const fileExtensions = browserFiles.map((file) => file.name.split(".").pop()?.toLowerCase());
		const allowedTypes = ["pdf", "png", "jpg", "doc", "docx"];

		for (const ext of fileExtensions) {
			if (!ext || !allowedTypes.includes(ext)) {
				setUploadError("Invalid file type. Only PDF, PNG, JPG, DOC, and DOCX are allowed.");
				return;
			}
		}

		for (const file of browserFiles) {
			if (file.size > MAX_FILE_SIZE_BYTES) {
				setUploadError("File is too large. Maximum allowed size is 50MB.");
				setFiles([]);
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

		const optimisticItems: SelectedFile[] = browserFiles.map((f) => ({
			id: crypto.randomUUID(),
			name: f.name,
			size: f.size,
			status: "uploading",
		}));

		startTransition(() => {
			setFiles((prev) => [...prev, ...optimisticItems]);
		});

		try {
			const formData = new FormData();
			for (const f of browserFiles) {
				formData.append("file", f);
			}

			const res = await fetch("/api/file-upload", {
				method: "POST",
				body: formData,
			});
			const data = await res.json();
			if (!res.ok) {
				setUploadError(data.error ?? "Issue uploading file");
				setFiles([]);
				return;
			}

			await new Promise((r) => setTimeout(r, 2000));

			startTransition(() => {
				setFiles((prev) =>
					prev.map((file) => {
						const uploadedMatch = data.files.find(
							(uploadedFile: SelectedFile) => uploadedFile.name === file.name,
						);
						if (!uploadedMatch) return file;

						return {
							...uploadedMatch,
							status: "upload-complete",
						};
					}),
				);
			});
		} catch (error) {
			console.error(error);
			setUploadError("Upload failed.");
			setFiles([]);
		}
	};

	const extractInfo = async () => {
		if (files.length === 0 || isExtracting) return;

		setExtractError("");
		setIsExtracting(true);

		try {
			const filenames = files.map((f) => f.name);

			const res = await fetch("/api/extract-file", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ filenames }),
			});

			const data = await res.json();

			if (!res.ok) {
				const errorMessage =
					typeof data?.error === "string" && data.error ? data.error : "Issue extracting file";
				setExtractError(errorMessage);
				setFiles((prev) => prev.map((f) => ({ ...f, status: "extract-failed" as const })));
				return;
			}

			const results: ExtractionResult[] = data.result || [];

			startTransition(() => {
				setFiles((prev) =>
					prev.map((file) => {
						const matchedResult = results.find((result) => result.name === file.name);

						if (!matchedResult) return file;

						return {
							...file,
							status: matchedResult.status === "failed" ? "extract-failed" : "extract-complete",
						};
					}),
				);

				setPatientData(data.extracted);
			});
		} catch (error) {
			setFiles((prev) => prev.map((f) => ({ ...f, status: "extract-failed" as const })));
			setExtractError(Error.isError(error) ? error.message : "Extraction failed.");
		} finally {
			setIsExtracting(false);
		}
	};

	return {
		files,
		uploadError,
		extractError,
		isExtracting,
		setUploadError,
		setExtractError,
		setFiles,
		clearFile,
		handleFiles,
		extractInfo,
	};
}
