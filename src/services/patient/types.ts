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
	newPatients: number;
	patientCreatedAt: string[];
	hasPatients: boolean;
};
