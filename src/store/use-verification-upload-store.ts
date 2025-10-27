import { Ref } from "react";
import { create } from "zustand";

export type FileExtensionType = "pdf" | "png" | "jpg" | "doc" | "";

type UploadInfo = Record<string, string>;

type UploadStatus = "idle" | "uploading" | "completed" | "failed";

type UploadState = {
	file: File | null;
	status: UploadStatus;
	uploadInfo: UploadInfo;
	uploadError: string;
	uploadType: FileExtensionType;
	uploadRef: Ref<HTMLInputElement | null>;

	setFile: (file: File | null) => void;
	setStatus: (status: UploadStatus) => void;
	setUploadInfo: (info: UploadInfo) => void;
	setUploadError: (error: string) => void;
	setUploadType: (type: FileExtensionType) => void;
	setUploadRef: (ref: Ref<HTMLInputElement | null>) => void;
	onClear: () => void;
};

const useVerificationUploadStore = create<UploadState>((set) => ({
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

export const useVerificationUpload = () => ({
	file: useVerificationUploadStore((s) => s.file),
	status: useVerificationUploadStore((s) => s.status),
	uploadInfo: useVerificationUploadStore((s) => s.uploadInfo),
	uploadError: useVerificationUploadStore((s) => s.uploadError),
	uploadType: useVerificationUploadStore((s) => s.uploadType),
	uploadRef: useVerificationUploadStore((s) => s.uploadRef),

	setFile: useVerificationUploadStore((s) => s.setFile),
	setStatus: useVerificationUploadStore((s) => s.setStatus),
	setUploadInfo: useVerificationUploadStore((s) => s.setUploadInfo),
	setUploadError: useVerificationUploadStore((s) => s.setUploadError),
	setUploadType: useVerificationUploadStore((s) => s.setUploadType),
	setUploadRef: useVerificationUploadStore((s) => s.setUploadRef),
	onClear: useVerificationUploadStore((s) => s.onClear),
});
