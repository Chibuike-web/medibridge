"use client";

import { FileExtensionType, VerificationUploadStatus } from "@/types/verification-upload";
import { ChangeEvent, useState } from "react";

const MAXSIZEINBYTES = 50 * 1024 * 1024;

type VerificationFileState = {
	file: File | null;
	status: VerificationUploadStatus;
	uploadedType: FileExtensionType;
	error: string;
};

export function useVerificationFileUpload() {
	const [verificationFile, setVerificationFile] = useState<VerificationFileState>({
		file: null,
		status: "idle",
		uploadedType: "",
		error: "",
	});

	const setUploadError = (error: string) => {
		setVerificationFile((prev) => ({ ...prev, error }));
	};

	const onClear = () => {
		setVerificationFile({
			file: null,
			status: "idle",
			uploadedType: "",
			error: "",
		});
	};

	const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (!selectedFile) {
			setVerificationFile((prev) => ({
				...prev,
				error: "Please select a valid file.",
				uploadedType: "",
			}));
			return;
		}

		const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
		const allowedTypes = ["pdf", "png", "jpg", "doc"];

		if (!fileExtension || !allowedTypes.includes(fileExtension)) {
			setVerificationFile((prev) => ({
				...prev,
				error: "Invalid file type. Only PDF, PNG, JPG, and DOC are allowed.",
				uploadedType: "",
			}));
			return;
		}

		if (selectedFile.size > MAXSIZEINBYTES) {
			setVerificationFile((prev) => ({
				...prev,
				file: null,
				error: "File is too large. Maximum allowed size is 50MB.",
			}));
			return;
		}

		setVerificationFile({
			file: selectedFile,
			status: "uploading",
			uploadedType: fileExtension as FileExtensionType,
			error: "",
		});

		try {
			const formData = new FormData();
			formData.append("file", selectedFile);
			const res = await fetch("/api/verification-file-upload", {
				method: "POST",
				body: formData,
			});
			const data = await res.json();

			if (!res.ok) {
				setVerificationFile({
					file: null,
					status: "idle",
					uploadedType: "",
					error: data.error ?? "Upload failed.",
				});
				return;
			}
			setVerificationFile((prev) => ({ ...prev, status: "upload-complete" }));
		} catch (error) {
			console.error(error);
			setVerificationFile({
				file: null,
				status: "idle",
				uploadedType: "",
				error: "Upload failed.",
			});
		}
	};

	return {
		file: verificationFile.file,
		status: verificationFile.status,
		uploadError: verificationFile.error,
		uploadedType: verificationFile.uploadedType,
		onClear,
		handleFileChange,
		setUploadError,
	};
}
