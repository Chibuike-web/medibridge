"use client";

import { useExtractedPatient } from "@/store/use-extracted-patient-store";
import { SelectedFile, useUpload } from "@/store/use-upload-store";
import { useRouter } from "next/navigation";
import { ChangeEvent, useOptimistic, startTransition } from "react";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export function useFileUpload() {
	const {
		files,
		setFiles,
		uploadError,
		uploadResults,
		setUploadError,
		setUploadResults,
		clearFile,
		clearAll,
	} = useUpload();

	const router = useRouter();
	const { setPatientData } = useExtractedPatient();
	const [optimisticFiles, setOptimisticFiles] = useOptimistic(files);

	const uploadSelectedFiles = async (e: ChangeEvent<HTMLInputElement>) => {
		setUploadError("");

		const lists = e.target.files;

		if (!lists || lists.length === 0) {
			setUploadError("Please select a valid file.");
			return;
		}

		let browserFiles;
		browserFiles = Array.from(lists);

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
				setFiles([]);
				e.target.value = "";
				return;
			}
		}

		const duplicates = Array.from(lists).filter((f) => files.some((file) => file.name === f.name));
		browserFiles = Array.from(lists).filter((f) => !files.some((file) => file.name === f.name));

		if (duplicates.length > 0) {
			alert(`Skipped duplicate files: ${duplicates.map((f) => f.name).join(", ")}`);
		}

		if (browserFiles.length === 0) {
			e.target.value = "";
			return;
		}

		startTransition(async () => {
			const optimisticItems: SelectedFile[] = browserFiles.map((f) => {
				return {
					id: crypto.randomUUID(),
					name: f.name,
					size: f.size,
					status: "uploading",
				};
			});
			setOptimisticFiles((prev) => [...prev, ...optimisticItems]);
			e.target.value = "";

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
					setUploadError(data.error);
					throw new Error("Issue uploading file");
				}

				setUploadResults(data.files);

				await new Promise((r) => setTimeout(r, 2000));

				startTransition(() => {
					const uploaded = data.files.map((f: SelectedFile) => {
						return {
							...f,
							status: "completed",
						};
					});
					setFiles([...files, ...uploaded]);
				});
			} catch (error) {
				throw new Error(Error.isError(error) ? error.message : "Internal Server");
			}
		});
	};

	const extractInfo = async () => {
		if (files.length === 0) return;

		startTransition(async () => {
			const extractingFiles = files.map((f) => ({ ...f, status: "extracting" as const }));
			setOptimisticFiles(extractingFiles);
			setFiles(extractingFiles);

			try {
				const filenames = files.map((f) => f.name);

				const res = await fetch("/api/extract-file", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ filenames }),
				});

				const extracted = await res.json();

				if (!res.ok) {
					throw new Error("Issue extracting file");
				}

				startTransition(() => {
					const uploaded: SelectedFile[] = files.map((f: SelectedFile) => {
						return {
							...f,
							status: "extracted",
						};
					});
					setFiles(uploaded);
					setPatientData(extracted);
				});

				clearAll();
				router.push("/dashboard/review-extracted-info");
			} catch (error) {
				throw new Error(Error.isError(error) ? error.message : "Internal Server");
			}
		});
	};

	return {
		files,
		uploadResults,
		uploadError,
		setUploadError,
		setFiles,
		clearFile,
		uploadSelectedFiles,
		optimisticFiles,
		extractInfo,
	};
}
