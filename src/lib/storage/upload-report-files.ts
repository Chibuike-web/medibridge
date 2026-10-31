export type UploadedReports = Map<string, { receipt: string; expiresAt: number }>;

type UploadReportFilesResult =
	| { status: "success"; receipts: string[] }
	| { status: "failed"; error: string }
	| { status: "unauthorized"; error: string };

export async function uploadReportFiles(
	files: File[],
	patientId: string,
	recordType: "lab" | "imaging",
	uploadedReports: UploadedReports,
): Promise<UploadReportFilesResult> {
	const receipts: string[] = [];

	for (const file of files) {
		const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
		const uploadedReport = uploadedReports.get(fileKey);
		if (uploadedReport && uploadedReport.expiresAt > Date.now()) {
			receipts.push(uploadedReport.receipt);
			continue;
		}

		const response = await fetch("/api/patient-record-files/upload", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: file.name,
				size: file.size,
				type: file.type,
				patientId,
				recordType,
			}),
		});
		const grant = await response.json();

		if (grant.status === "unauthorized") {
			return { status: "unauthorized", error: grant.error };
		}

		if (!response.ok || grant.status !== "success") {
			return {
				status: "failed",
				error: grant.error ?? "We couldn’t upload this report. Please try again.",
			};
		}

		const uploaded = await fetch(grant.signedUrl, {
			method: "PUT",
			headers: { "Content-Type": file.type, "x-upsert": "false" },
			body: file,
		});

		if (!uploaded.ok) {
			return { status: "failed", error: "We couldn’t upload this report. Please try again." };
		}

		uploadedReports.set(fileKey, {
			receipt: grant.receipt,
			expiresAt: Date.now() + (grant.expiresIn - 60) * 1000,
		});
		receipts.push(grant.receipt);
	}

	return { status: "success", receipts };
}
