"use client";

import { AllowedFileExtension, SelectedFile, useUpload } from "@/store/use-upload-store";
import { ChangeEvent, useOptimistic, startTransition } from "react";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export function useFileUpload() {
	const {
		selectedFiles,
		setSelectedFiles,
		uploadError,
		uploadResults,
		setUploadError,
		setUploadResults,
		clearFile,
	} = useUpload();
	const [optimisticFiles, setOptimisticFiles] = useOptimistic(selectedFiles);

	const uploadSelectedFiles = async (e: ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;

		if (!files || files.length === 0) {
			setUploadError("Please select a valid file.");
			return;
		}

		const browserFiles = Array.from(files);

		const fileExtensions = browserFiles.map((file) => file.name.split(".").pop()?.toLowerCase());
		const allowedTypes = ["pdf", "png", "jpg", "doc", "docx"];

		for (const ext of fileExtensions) {
			if (!ext || !allowedTypes.includes(ext)) {
				setUploadError("Invalid file type. Only PDF, PNG, JPG, and DOC are allowed.");
				e.target.value = "";
				return;
			}
		}

		for (const file of browserFiles) {
			if (file.size > MAX_FILE_SIZE_BYTES) {
				setUploadError("File is too large. Maximum allowed size is 50MB.");
				setSelectedFiles([]);
				e.target.value = "";
				return;
			}
		}

		setUploadError("");

		const optimisticItems: SelectedFile[] = browserFiles.map((file) => {
			const extension = file.name.split(".").pop()?.toLowerCase() as AllowedFileExtension;

			return {
				id: crypto.randomUUID(),
				name: file.name,
				size: file.size,
				extension,
				status: "uploading",
			};
		});

		startTransition(async () => {
			setOptimisticFiles((prev) => [...prev, ...optimisticItems]);
			e.target.value = "";

			try {
				const formData = new FormData();
				for (const file of browserFiles) {
					formData.append("file", file);
				}

				const res = await fetch("/api/file-upload", {
					method: "POST",
					body: formData,
				});
				const data = await res.json();
				if (!res.ok) {
					setUploadError(data.error);
					throw new Error("Issue uploading file");
				}

				setUploadResults(data.files);

				await new Promise((r) => setTimeout(r, 5000));

				startTransition(() => {
					const uploaded = data.files.map((f: SelectedFile) => {
						const extension = f.name.split(".").pop()?.toLowerCase() as AllowedFileExtension;

						return {
							...f,
							extension,
							status: "completed",
						};
					});
					const map = new Map([...selectedFiles, ...uploaded].map((f) => [f.name, f]));
					setSelectedFiles(Array.from(map.values()));
				});
			} catch (error) {
				console.error(error);
			}
		});
	};

	return {
		selectedFiles,
		uploadResults,
		uploadError,
		setUploadError,
		setSelectedFiles,
		clearFile,
		uploadSelectedFiles,
		optimisticFiles,
	};
}
