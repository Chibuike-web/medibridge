import { Ref } from "react";
import { create } from "zustand";

export type AllowedFileExtension = "pdf" | "png" | "jpg" | "doc" | "";

export type UploadResult = {
	name: string;
	size: number;
	type: string;
	url: string;
};
export type UploadStatus = "idle" | "uploading" | "completed" | "failed";

export type SelectedFile = {
	id: string;
	file: File;
	extension: AllowedFileExtension;
	status: UploadStatus;
	fileInputRef?: Ref<HTMLInputElement>;
};

type UploadState = {
	selectedFiles: SelectedFile[];
	uploadResults: UploadResult[];
	uploadError: string;

	setSelectedFiles: (files: SelectedFile[]) => void;
	updateFileStatus: (id: string, status: UploadStatus) => void;
	clearFile: (id: string) => void;
	clearAll: () => void;
	setUploadError: (error: string) => void;
	setUploadResults: (results: UploadResult[]) => void;
};

const useUploadStore = create<UploadState>((set) => ({
	selectedFiles: [],
	uploadResults: [],
	uploadError: "",

	setSelectedFiles: (files) => set({ selectedFiles: files }),
	updateFileStatus: (id, status) =>
		set((state) => ({
			selectedFiles: state.selectedFiles.map((file) =>
				file.id === id ? { ...file, status } : file,
			),
		})),
	clearFile: (id) =>
		set((state) => ({
			selectedFiles: state.selectedFiles.filter((f) => f.id !== id),
		})),
	clearAll: () =>
		set({
			selectedFiles: [],
			uploadResults: [],
			uploadError: "",
		}),
	setUploadError: (error: string) => set({ uploadError: error }),
	setUploadResults: (uploadResults) => set({ uploadResults }),
}));

export const useUpload = () => ({
	selectedFiles: useUploadStore((s) => s.selectedFiles),
	uploadResults: useUploadStore((s) => s.uploadResults),
	uploadError: useUploadStore((s) => s.uploadError),

	setSelectedFiles: useUploadStore((s) => s.setSelectedFiles),
	updateFileStatus: useUploadStore((s) => s.updateFileStatus),
	setUploadResults: useUploadStore((s) => s.setUploadResults),
	setUploadError: useUploadStore((s) => s.setUploadError),
	clearFile: useUploadStore((s) => s.clearFile),
	clearAll: useUploadStore((s) => s.clearAll),
});
