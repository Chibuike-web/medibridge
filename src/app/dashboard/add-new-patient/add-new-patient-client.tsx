"use client";

import { ChooseFileCard } from "@/components/choose-file-card";
import { FileUploadCard } from "@/components/file-upload-card";
import { Button } from "@/components/ui/button";
import { useFileParse } from "@/hooks/use-file-parse";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useRef } from "react";

export function AddNewPatientClient() {
	const { selectedFiles: files, clearFile, uploadError, uploadSelectedFiles } = useFileUpload();
	const { parseStatus } = useFileParse();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const clear = (id: string) => {
		clearFile(id);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};
	return (
		<>
			<div>
				{files.length > 0 ? (
					<>
						<div className="flex flex-col gap-3 mb-50">
							{files.map((file) => (
								<FileUploadCard key={file.id} file={file} onRemove={clear} />
							))}
						</div>
						{uploadError ? (
							<p className="text-red-500 text-sm mt-2 text-pretty">{uploadError}</p>
						) : null}
					</>
				) : (
					<ChooseFileCard handleFileChange={uploadSelectedFiles} fileInputRef={fileInputRef} />
				)}
				{parseStatus === "error" ? (
					<p className="text-red-500 font-medium mt-2 text-pretty">
						Issue parsing the file, Try again
					</p>
				) : null}
			</div>
			<Footer />
		</>
	);
}

function Footer() {
	const { setParseStatus, parseFile } = useFileParse();
	return (
		<footer className="fixed z-50 bottom-0 left-0 right-0 flex items-center justify-center border-t h-20 border-gray-200 pb-[env(safe-area-inset-bottom)] bg-white">
			<div className="flex w-full justify-between items-center max-w-xl">
				<Button variant="outline" className="h-11">
					Upload More
				</Button>
				<Button
					className="h-11"
					onClick={() => {
						parseFile();
						setParseStatus("parsing");
					}}
				>
					Parse Document
				</Button>
			</div>
		</footer>
	);
}
