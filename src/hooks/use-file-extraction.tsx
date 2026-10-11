"use client";

import type { ExtractionResult, FileExtractionState, SelectedFile } from "@/lib/types/upload";
import { useState } from "react";

type ExtractFileResponse =
	| { status: "success"; extractionId: string; result: ExtractionResult[] }
	| { status: "failed"; error: string };

export function useFileExtraction(files: SelectedFile[]) {
	const [fileExtractions, setFileExtractions] = useState<
		Partial<Record<string, FileExtractionState>>
	>({});
	const [extractError, setExtractError] = useState("");
	const isExtracting = Object.values(fileExtractions).some(
		(extraction) => extraction?.status === "extracting",
	);
	const extractionIds = [
		...new Set(
			files
				.filter((file) => file.status === "upload-complete")
				.map((file) => fileExtractions[file.clientId])
				.filter((extraction) => extraction?.status === "extract-complete")
				.map((extraction) => extraction.extractionId),
		),
	];

	async function extractInfo(fileIds?: string[]) {
		if (isExtracting) return;

		const targetFiles = files
			.filter((file) => file.status === "upload-complete")
			.filter((file) => !fileIds || fileIds.includes(file.clientId))
			.filter((file) => fileExtractions[file.clientId]?.status !== "extract-complete");
		if (targetFiles.length === 0) return;

		setExtractError("");
		setFileExtractions((prev) => {
			const next = { ...prev };
			for (const file of targetFiles) {
				next[file.clientId] = { status: "extracting" };
			}
			return next;
		});

		try {
			const response = await fetch("/api/extract-file", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ filenames: targetFiles.map((file) => file.storedName) }),
			});
			const data: ExtractFileResponse = await response.json();

			if (
				!response.ok ||
				data.status !== "success" ||
				typeof data.extractionId !== "string" ||
				!data.extractionId
			) {
				const error =
					data.status === "failed"
						? data.error
						: "We couldn’t load the saved extraction. Please try again.";
				setExtractError(error);
				setFileExtractions((prev) => {
					const next = { ...prev };
					for (const file of targetFiles) {
						next[file.clientId] = { status: "extract-failed", error };
					}
					return next;
				});
				return;
			}

			setFileExtractions((prev) => {
				const next = { ...prev };
				for (const file of targetFiles) {
					const result = (data.result ?? []).find((result) => result.name === file.storedName);
					next[file.clientId] =
						result?.status === "success"
							? { status: "extract-complete", extractionId: data.extractionId }
							: {
									status: "extract-failed",
									error: result?.error ?? "We couldn’t extract this file. Please try again.",
								};
				}
				return next;
			});
		} catch (error) {
			console.error("Extracting patient records failed:", error);
			const message = "We couldn’t extract patient information. Please try again.";
			setExtractError(message);
			setFileExtractions((prev) => {
				const next = { ...prev };
				for (const file of targetFiles) {
					next[file.clientId] = { status: "extract-failed", error: message };
				}
				return next;
			});
		}
	}

	return {
		fileExtractions,
		extractionIds,
		isExtracting,
		extractError,
		setExtractError,
		extractInfo,
	};
}
