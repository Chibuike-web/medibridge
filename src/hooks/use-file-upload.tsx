"use client";

import { ChangeEvent, useRef, useState } from "react";

const MAXSIZEINBYTES = 50 * 1024 * 1024;

export type FileExtensionType = "pdf" | "png" | "jpg" | "doc" | "";

export default function useFileUpload() {
	const [file, setFile] = useState<File | null>(null);
	const [status, setStatus] = useState<"idle" | "uploading" | "completed" | "failed">("idle");
	const [uploadInfo, setUploadInfo] = useState({});
	const [uploadError, setUploadError] = useState("");
	const uploadRef = useRef<HTMLInputElement | null>(null);
	const [uploadType, setUploadType] = useState<FileExtensionType>("");

	const onClear = () => {
		setFile(null);
		setStatus("idle");
		if (uploadRef.current) uploadRef.current.value = "";
	};

	const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
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

		if (selectedFile.size > MAXSIZEINBYTES) {
			setUploadError("File is too large. Maximum allowed size is 50MB.");
			setFile(null);
			return;
		}

		setUploadType(fileExtension as FileExtensionType);
		setUploadError("");

		setStatus("uploading");
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
			setFile(selectedFile);
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
		onClear,
		handleFileChange,
		uploadInfo,
	};
}
