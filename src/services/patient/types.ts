import type { createWorker } from "tesseract.js";

export type OcrWorker = Awaited<ReturnType<typeof createWorker>>;

export type ExtractTextResult =
	| { status: "success"; text: string }
	| { status: "failed"; error: string };

export type SavePatientsResult =
	| {
			status: "success";
			savedCount: number;
	  }
	| {
			status: "failed" | "unauthorized";
			error: string;
	  };

export type OverviewStats = {
	totalPatients: number;
	transferredRecords: number;
	pendingTransfers: number;
	patientCreatedAt: string[];
	patientTransferredAt: string[];
	pendingTransferredAt: string[];
	encounterCreatedAt: string[];
	hasPatients: boolean;
};
