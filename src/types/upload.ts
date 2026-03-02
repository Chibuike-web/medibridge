export type AllowedFileExtension = "pdf" | "png" | "jpg" | "doc" | "";

export type UploadStatus =
	| "idle"
	| "uploading"
	| "completed"
	| "failed"
	| "extracting"
	| "extracted";

export type SavedFileTypes = {
	id: string;
	url?: string;
	type?: string;
	size: number;
	name: string;
};

export type SelectedFile = SavedFileTypes & {
	status: UploadStatus;
};
