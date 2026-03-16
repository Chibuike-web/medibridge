export type SavePatientRecordsResult =
  | {
      status: "success";
      savedCount: number;
    }
  | {
      status: "failed";
      error: string;
    };