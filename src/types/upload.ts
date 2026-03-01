export type AllowedFileExtension = "pdf" | "png" | "jpg" | "doc" | "";

export type UploadResult = {
	name: string;
	size: number;
	type: string;
	path: string;
	error?: string;
};

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

export type UploadStoreState = {
	files: SelectedFile[];
	uploadResults: UploadResult[];
	setFiles: (files: SelectedFile[] | ((prev: SelectedFile[]) => SelectedFile[])) => void;
	clearFile: (id: string) => void;
	clearAll: () => void;
	setUploadResults: (results: UploadResult[]) => void;
};
