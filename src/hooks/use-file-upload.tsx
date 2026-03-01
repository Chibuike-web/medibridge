"use client";

import { useExtractedPatient } from "@/store/use-extracted-patient-store";
import { useUpload } from "@/store/use-upload-store";
import { SelectedFile } from "@/types/upload";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export function useFileUpload() {
	const { files, setFiles, uploadResults, setUploadResults, clearFile, clearAll } = useUpload();
	const [uploadError, setUploadError] = useState("");
	const [extractError, setExtractError] = useState("");

	const router = useRouter();
	const { setPatientData } = useExtractedPatient();

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
				setUploadError("Invalid file type. Only PDF, PNG, JPG, and DOC are allowed.");
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

		const optimisticItems: SelectedFile[] = browserFiles.map((f) => {
			return {
				id: crypto.randomUUID(),
				name: f.name,
				size: f.size,
				status: "uploading",
			};
		});

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
				setFiles((prev) =>
					prev.map((file) =>
						optimisticItems.some((optimistic) => optimistic.id === file.id)
							? { ...file, status: "failed" as const }
							: file,
					),
				);
				return;
			}

			setUploadResults(data.files);

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
							status: "completed",
						};
					}),
				);
			});
		} catch (error) {
			console.error(error);
			setFiles((prev) =>
				prev.map((file) =>
					optimisticItems.some((optimistic) => optimistic.id === file.id)
						? { ...file, status: "failed" as const }
						: file,
				),
			);
			setUploadError("Upload failed.");
		}
	};

	const extractInfo = async () => {
		if (files.length === 0) return;
		setExtractError("");

		startTransition(() => {
			setFiles((prev) => prev.map((f) => ({ ...f, status: "extracting" as const })));
		});
		try {
			const filenames = files.map((f) => f.name);

			const res = await fetch("/api/extract-file", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ filenames }),
			});

			const extracted = await res.json();

			if (!res.ok) {
				const errorMessage =
					typeof extracted?.error === "string" && extracted.error
						? extracted.error
						: "Issue extracting file";
				setExtractError(errorMessage);
				return;
			}

			startTransition(() => {
				setFiles((prev) => prev.map((f) => ({ ...f, status: "extracted" as const })));
				setPatientData(extracted);
			});

			clearAll();
			router.push("/dashboard/review-extracted-info");
		} catch (error) {
			console.error(error);
			setExtractError("Extraction failed.");
		}
	};

	return {
		files,
		uploadResults,
		uploadError,
		extractError,
		setUploadError,
		setExtractError,
		setFiles,
		clearFile,
		handleFiles,
		extractInfo,
	};
}
