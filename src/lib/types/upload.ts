export type AllowedFileExtension = "pdf" | "png" | "jpg" | "jpeg" | "doc" | "docx" | "";

export type SavedFileTypes = {
	clientId: string;
	name: string;
} & (
	| {
			status: "upload-complete";
			id: string;
			storedName: string;
			url: string;
			type: string;
			size: number;
	  }
	| { status: "upload-failed" }
);

export type SelectedFile = {
	clientId: string;
	browserFile: File;
	name: string;
	size: number;
} & (
	| { status: "idle" }
	| { status: "uploading" }
	| { status: "upload-failed" }
	| ({
			id: string;
			storedName: string;
			url: string;
			type: string;
	  } & ({ status: "upload-complete" } | { status: "deleting" }))
);

export type FileExtractionState =
	| { status: "extracting" }
	| { status: "extract-failed"; error: string }
	| { status: "extract-complete"; extractionId: string };

export type FileUploadStatus = SelectedFile["status"];
export type FileExtractionStatus = FileExtractionState["status"];

export type ExtractionResult = {
	name: string;
	path: string;
	status: "success" | "failed";
	error?: string;
	text: string;
};
