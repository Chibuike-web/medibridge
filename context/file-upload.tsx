import useFileUpload from "@/hooks/use-file-upload";
import { createContext, useContext } from "react";

const FileUploadContext = createContext<ReturnType<typeof useFileUpload> | null>(null);

export function FileUploadProvider({ children }: { children: React.ReactNode }) {
	const fileUpload = useFileUpload();

	return <FileUploadContext.Provider value={fileUpload}>{children}</FileUploadContext.Provider>;
}

export function useFileUploadContext() {
	const context = useContext(FileUploadContext);
	if (!context) {
		throw new Error("useFileUploadContext must be used within a FileUploadProvider");
	}
	return context;
}
