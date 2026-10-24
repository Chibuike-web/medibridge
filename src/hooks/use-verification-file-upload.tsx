"use client";

import { FileExtensionType, VerificationUploadStatus } from "@/lib/types/verification-upload";
import { ChangeEvent, useState } from "react";

const MAXSIZEINBYTES = 50 * 1024 * 1024;

type VerificationFileState = {
	file: File | null;
	status: VerificationUploadStatus;
	uploadedType: FileExtensionType;
	error: string;
	resStatus?: number;
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
			const res = await fetch("/api/verification-file-upload", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: selectedFile.name,
					size: selectedFile.size,
					type: selectedFile.type || "application/octet-stream",
				}),
			});
			const data: { error?: string; signedUrl?: string; type?: string } = await res
				.json()
				.catch(() => ({}));

			if (!res.ok) {
				setVerificationFile({
					file: null,
					status: "idle",
					uploadedType: "",
					error: data.error ?? "We couldn’t upload your file. Please try again",
					resStatus: res.status,
				});
				return;
			}
			if (!data.signedUrl || !data.type) throw new Error("Missing upload authorization.");
			const upload = await fetch(data.signedUrl, {
				method: "PUT",
				headers: { "Content-Type": data.type, "x-upsert": "false" },
				body: selectedFile,
			});
			if (!upload.ok) throw new Error("Storage rejected upload.");
			setVerificationFile((prev) => ({ ...prev, status: "upload-complete" }));
		} catch {
			setVerificationFile({
				file: null,
				status: "idle",
				uploadedType: "",
				error: "We couldn’t upload your file. Please try again.",
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
