"use client";

import { FileExtensionType, useUpload } from "@/store/use-upload-store";
import { ChangeEvent } from "react";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export function useFileUpload() {
	const {
		file,
		status,
		setFile,
		setStatus,
		uploadError,
		uploadInfo,
		uploadType,
		uploadRef,
		setUploadError,
		setUploadInfo,
		setUploadType,
		onClear,
	} = useUpload();

	const uploadSelectedFiles = async (e: ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (!selectedFile) {
			setUploadError("Please select a valid file.");
			setUploadType("");
			return;
		}

		const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
		const allowedTypes = ["pdf", "png", "jpg", "doc"];

		if (!fileExtension || !allowedTypes.includes(fileExtension)) {
			setUploadError("Invalid file type. Only PDF, PNG, JPG, and DOC are allowed.");
			setUploadType("");
			return;
		}

		if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
			setUploadError("File is too large. Maximum allowed size is 50MB.");
			setFile(null);
			return;
		}

		setUploadType(fileExtension as FileExtensionType);
		setUploadError("");

		setStatus("uploading");
		setFile(selectedFile);

		try {
			const formData = new FormData();
			formData.append("file", selectedFile);
			const res = await fetch("/api/file-upload", {
				method: "POST",
				body: formData,
			});
			const data = await res.json();
			if (!res.ok) {
				setUploadError(data.error);
				throw new Error("Issue uploading file");
			}
			setStatus("completed");
			setUploadInfo(data);
		} catch (error) {
			console.error(error);
			setUploadError("Upload failed.");
			setStatus("failed");
		}
	};

	return {
		file,
		status,
		uploadError,
		uploadType,
		uploadRef,
		uploadInfo,
		onClear,
		uploadSelectedFiles,
	};
}
