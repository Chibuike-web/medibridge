export type FileExtensionType = "pdf" | "png" | "jpg" | "doc" | "";

export type UploadInfo = Record<string, string>;

export type VerificationUploadStatus = "idle" | "uploading" | "completed" | "failed";
