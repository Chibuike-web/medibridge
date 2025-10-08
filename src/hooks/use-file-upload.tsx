import { ChangeEvent, FormEvent, useRef, useState } from "react";

const MAXSIZEINBYTES = 50 * 1024 * 1024;

export type FileExtensionType = "pdf" | "png" | "jpg" | "doc" | "";

export default function useFileUpload() {
	const [file, setFile] = useState<File | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [uploadError, setUploadError] = useState("");
	const uploadRef = useRef<HTMLInputElement | null>(null);
	const [uploadType, setUploadType] = useState<FileExtensionType>("");

	const onClear = () => {
		setFile(null);
		if (uploadRef.current) uploadRef.current.value = "";
	};

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (!selectedFile) {
			setUploadError("Please select a valid file.");
			setUploadType("");
			return;
		}
		const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();

		const allowedTypes = ["pdf", "png", "jpg", "doc"];

		if (fileExtension && allowedTypes.includes(fileExtension)) {
			setUploadType(fileExtension as FileExtensionType);
			setUploadError("");
		} else {
			setUploadError("Invalid file type. Only PDF, PNG, JPG, and DOC are allowed.");
			setUploadType("");
			return;
		}
		if (selectedFile.size > MAXSIZEINBYTES) {
			setUploadError("File is too large. Maximum allowed size is 50MB.");
			setFile(null);
			return;
		}
		setFile(selectedFile);
	};

	return {
		file,
		isLoading,
		uploadError,
		uploadType,
		uploadRef,
		onClear,
		handleFileChange,
	};
}
