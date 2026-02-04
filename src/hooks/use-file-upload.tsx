"use client";

import { AllowedFileExtension, UploadStatus, useUpload } from "@/store/use-upload-store";
import { ChangeEvent } from "react";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export function useFileUpload() {
	const {
		selectedFiles,
		setSelectedFiles,
		uploadError,
		updateFileStatus,
		uploadResults,
		setUploadError,
		setUploadResults,
		clearFile,
	} = useUpload();

	const uploadSelectedFiles = async (e: ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;

		if (!files || files.length === 0) {
			setUploadError("Please select a valid file.");
			return;
		}

		const browserFiles = Array.from(files);

		const fileExtensions = browserFiles.map((file) => file.name.split(".").pop()?.toLowerCase());
		const allowedTypes = ["pdf", "png", "jpg", "doc"];

		for (const ext of fileExtensions) {
			if (!ext || !allowedTypes.includes(ext)) {
				setUploadError("Invalid file type. Only PDF, PNG, JPG, and DOC are allowed.");
				return;
			}
		}

		for (const file of browserFiles) {
			if (file.size > MAX_FILE_SIZE_BYTES) {
				setUploadError("File is too large. Maximum allowed size is 50MB.");
				setSelectedFiles([]);
				return;
			}
		}

		setUploadError("");

		const selectedFilesWithStatus = browserFiles.map((file) => {
			const extension = file.name.split(".").pop()?.toLowerCase() as AllowedFileExtension;

			return {
				id: crypto.randomUUID(),
				file,
				extension,
				status: "uploading" as UploadStatus,
			};
		});

		setSelectedFiles(selectedFilesWithStatus);

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

			data.files.forEach((result: { name: string }) => {
				const file = selectedFilesWithStatus.find((f) => f.file.name === result.name);
				console.log(file?.id);
				console.log(file?.file.name);
				if (file) {
					updateFileStatus(file.id, "completed");
				}
			});

			console.log(data.files);
		} catch (error) {
			console.error(error);
			setUploadError("Upload failed.");
			selectedFiles.forEach((file) => {
				updateFileStatus(file.id, "failed");
			});
		}
	};

	return {
		selectedFiles,
		uploadResults,
		uploadError,
		clearFile,
		uploadSelectedFiles,
	};
}
