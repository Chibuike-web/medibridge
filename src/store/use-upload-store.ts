// store/useUploadStore.ts
import { Ref } from "react";
import { create } from "zustand";

export type FileExtensionType = "pdf" | "png" | "jpg" | "doc" | "";

type UploadInfo = Record<string, any>;

type UploadStatus = "idle" | "uploading" | "completed" | "failed";

type UploadState = {
	file: File | null;
	status: UploadStatus;
	uploadInfo: UploadInfo;
	uploadError: string;
	uploadType: FileExtensionType;
	uploadRef: Ref<HTMLInputElement | null>;

	// actions
	setFile: (file: File | null) => void;
	setStatus: (status: UploadStatus) => void;
	setUploadInfo: (info: UploadInfo) => void;
	setUploadError: (error: string) => void;
	setUploadType: (type: FileExtensionType) => void;
	setUploadRef: (ref: Ref<HTMLInputElement | null>) => void;
	onClear: () => void;
};

const useUploadStore = create<UploadState>((set) => ({
	file: null,
	status: "idle",
	uploadInfo: {},
	uploadError: "",
	uploadType: "",
	uploadRef: null,

	setFile: (file) => set({ file }),
	setStatus: (status) => set({ status }),
	setUploadInfo: (uploadInfo) => set({ uploadInfo }),
	setUploadError: (uploadError) => set({ uploadError }),
	setUploadType: (uploadType) => set({ uploadType }),
	setUploadRef: (uploadRef) => set({ uploadRef }),
	onClear: () =>
		set({
			file: null,
			status: "idle",
			uploadInfo: {},
			uploadError: "",
			uploadType: "",
			uploadRef: null,
		}),
}));

export const useUpload = () => ({
	file: useUploadStore((s) => s.file),
	status: useUploadStore((s) => s.status),
	uploadInfo: useUploadStore((s) => s.uploadInfo),
	uploadError: useUploadStore((s) => s.uploadError),
	uploadType: useUploadStore((s) => s.uploadType),
	uploadRef: useUploadStore((s) => s.uploadRef),

	setFile: useUploadStore((s) => s.setFile),
	setStatus: useUploadStore((s) => s.setStatus),
	setUploadInfo: useUploadStore((s) => s.setUploadInfo),
	setUploadError: useUploadStore((s) => s.setUploadError),
	setUploadType: useUploadStore((s) => s.setUploadType),
	setUploadRef: useUploadStore((s) => s.setUploadRef),
	onClear: useUploadStore((s) => s.onClear),
});
