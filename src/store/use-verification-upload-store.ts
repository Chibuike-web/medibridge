import { create } from "zustand";
import { VerificationUploadState } from "@/types/verification-upload";

const useVerificationUploadStore = create<VerificationUploadState>((set) => ({
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
	onClear: () =>
		set({
			file: null,
			status: "idle",
			uploadInfo: {},
			uploadError: "",
			uploadType: "",
		}),
}));

export const useVerificationUpload = () => ({
	file: useVerificationUploadStore((s) => s.file),
	status: useVerificationUploadStore((s) => s.status),
	uploadInfo: useVerificationUploadStore((s) => s.uploadInfo),
	uploadError: useVerificationUploadStore((s) => s.uploadError),
	uploadType: useVerificationUploadStore((s) => s.uploadType),

	setFile: useVerificationUploadStore((s) => s.setFile),
	setStatus: useVerificationUploadStore((s) => s.setStatus),
	setUploadInfo: useVerificationUploadStore((s) => s.setUploadInfo),
	setUploadError: useVerificationUploadStore((s) => s.setUploadError),
	setUploadType: useVerificationUploadStore((s) => s.setUploadType),
	onClear: useVerificationUploadStore((s) => s.onClear),
});
