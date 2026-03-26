export type SavePatientRecordsResult =
  | {
      status: "success";
      savedCount: number;
    }
  | {
      status: "failed";
      error: string;
    };

export type OverviewStats = {
	totalPatients: number;
	transferredRecords: number;
	pendingTransfers: number;
	patientCreatedAt: string[];
	patientTransferredAt: string[];
	pendingTransferredAt: string[];
	hasPatients: boolean;
};
