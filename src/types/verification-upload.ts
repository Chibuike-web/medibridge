export type FileExtensionType = "pdf" | "png" | "jpg" | "doc" | "";

export type UploadInfo = Record<string, string>;

export type VerificationUploadStatus = "idle" | "uploading" | "completed" | "failed";

export type VerificationUploadState = {
	file: File | null;
	status: VerificationUploadStatus;
	uploadInfo: UploadInfo;
	uploadError: string;
	uploadType: FileExtensionType;
	setFile: (file: File | null) => void;
	setStatus: (status: VerificationUploadStatus) => void;
	setUploadInfo: (info: UploadInfo) => void;
	setUploadError: (error: string) => void;
	setUploadType: (type: FileExtensionType) => void;
	onClear: () => void;
};
