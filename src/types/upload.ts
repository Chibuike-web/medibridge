export type AllowedFileExtension = "pdf" | "png" | "jpg" | "doc" | "docx" | "";

export type FileStatus =
	| "idle"
	| "uploading"
	| "upload-complete"
	| "deleting"
	| "extract-complete"
	| "extract-failed";

export type SavedFileTypes = {
	id: string;
	url?: string;
	type?: string;
	size: number;
	name: string;
};

export type SelectedFile = SavedFileTypes & {
	status: FileStatus;
};

export type ExtractionResult = {
	name: string;
	path: string;
	status: "success" | "failed";
	error?: string;
	text: string;
};
