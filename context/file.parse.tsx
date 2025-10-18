import useFileParse from "@/hooks/use-file-parse";
import { createContext, useContext } from "react";

const FileParseContext = createContext<ReturnType<typeof useFileParse> | null>(null);
export default function FileParseProvider({ children }: { children: React.ReactNode }) {
	const fileParse = useFileParse();
	return <FileParseContext.Provider value={fileParse}>{children}</FileParseContext.Provider>;
}

export function useFileParseContext() {
	const context = useContext(FileParseContext);
	if (!context) {
		throw new Error("useFileParseContext must be used within a FileParseProvider");
	}
	return context;
}
