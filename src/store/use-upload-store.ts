import { create } from "zustand";

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

type UploadState = {
	files: SelectedFile[];
	uploadResults: UploadResult[];
	uploadError: string;

	setFiles: (files: SelectedFile[]) => void;
	clearFile: (id: string) => void;
	clearAll: () => void;
	setUploadError: (error: string) => void;
	setUploadResults: (results: UploadResult[]) => void;
};

const useUploadStore = create<UploadState>((set) => ({
	files: [],
	uploadResults: [],
	uploadError: "",

	setFiles: (files) => set({ files }),

	clearFile: (id) =>
		set((state) => ({
			files: state.files.filter((f) => f.id !== id),
		})),
	clearAll: () =>
		set({
			files: [],
			uploadResults: [],
			uploadError: "",
		}),
	setUploadError: (error: string) => set({ uploadError: error }),
	setUploadResults: (uploadResults) => set({ uploadResults }),
}));

export const useUpload = () => ({
	files: useUploadStore((s) => s.files),
	uploadResults: useUploadStore((s) => s.uploadResults),
	uploadError: useUploadStore((s) => s.uploadError),

	setFiles: useUploadStore((s) => s.setFiles),
	setUploadResults: useUploadStore((s) => s.setUploadResults),
	setUploadError: useUploadStore((s) => s.setUploadError),
	clearFile: useUploadStore((s) => s.clearFile),
	clearAll: useUploadStore((s) => s.clearAll),
});
