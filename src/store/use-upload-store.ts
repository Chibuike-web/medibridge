import { create } from "zustand";
import { UploadStoreState } from "@/types/upload";

const useUploadStore = create<UploadStoreState>((set) => ({
	files: [],
	uploadResults: [],

	setFiles: (files) =>
		set((state) => ({
			files: typeof files === "function" ? files(state.files) : files,
		})),

	clearFile: (id) =>
		set((state) => ({
			files: state.files.filter((f) => f.id !== id),
		})),
	clearAll: () =>
		set({
			files: [],
			uploadResults: [],
		}),
	setUploadResults: (uploadResults) => set({ uploadResults }),
}));

export const useUpload = () => ({
	files: useUploadStore((s) => s.files),
	uploadResults: useUploadStore((s) => s.uploadResults),

	setFiles: useUploadStore((s) => s.setFiles),
	setUploadResults: useUploadStore((s) => s.setUploadResults),
	clearFile: useUploadStore((s) => s.clearFile),
	clearAll: useUploadStore((s) => s.clearAll),
});
