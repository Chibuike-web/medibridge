"use client";

import type { FileExtractionState, SelectedFile } from "@/lib/types/upload";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ExtractFileResponse =
	| { status: "success"; extractionId: string; hasReadyDocument: boolean }
	| { status: "failed"; error: string };

export function useFileExtraction(files: SelectedFile[]) {
	const router = useRouter();
	const [fileExtractions, setFileExtractions] = useState<
		Partial<Record<string, FileExtractionState>>
	>({});
	const [extractError, setExtractError] = useState("");
	const isExtracting = Object.values(fileExtractions).some(
		(extraction) => extraction?.status === "extracting",
	);

	async function extractInfo(fileIds?: string[]) {
		const targetFiles = files
			.filter((file) => file.status === "upload-complete")
			.filter((file) => !fileIds || fileIds.includes(file.clientId))
			.filter((file) => fileExtractions[file.clientId]?.status !== "extracting");
		if (targetFiles.length === 0) return;

		const failedExtraction = fileExtractions[targetFiles[0].clientId];
		const extractionId =
			failedExtraction?.status === "extract-failed" ? failedExtraction.extractionId : undefined;

		setExtractError("");
		setFileExtractions((prev) => {
			const next = { ...prev };
			for (const file of targetFiles) {
				next[file.clientId] = { status: "extracting" };
			}
			return next;
		});

		const data: ExtractFileResponse = await fetch("/api/extract-file", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ filenames: targetFiles.map((file) => file.storedName), extractionId }),
		})
			.then((response) => response.json())
			.catch((error) => {
				console.error("Extracting patient records failed:", error);
				return {
					status: "failed",
					error: "We couldn’t extract patient information. Please try again.",
				};
			});

		if (data.status === "success" && data.hasReadyDocument) {
			router.push(`/dashboard/review-extracted-info?extractionId=${data.extractionId}`);
			return;
		}

		if (data.status === "failed") {
			setExtractError(data.error);
		}
		setFileExtractions((prev) => {
			const next = { ...prev };
			for (const file of targetFiles) {
				next[file.clientId] = {
					status: "extract-failed",
					extractionId: data.status === "success" ? data.extractionId : extractionId,
				};
			}
			return next;
		});
	}

	return { fileExtractions, isExtracting, extractError, setExtractError, extractInfo };
}
