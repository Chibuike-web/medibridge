"use client";

import { ChooseFileCard } from "@/components/choose-file-card";
import { FileUploadCard } from "@/components/file-upload-card";
import { Button } from "@/components/ui/button";
import { useFileParse } from "@/hooks/use-file-parse";
import { useFileUpload } from "@/hooks/use-file-upload";

export function AddNewPatientClient() {
	const { file, status, uploadType, uploadError, uploadRef, onClear, uploadSelectedFiles } =
		useFileUpload();
	const { parseStatus, setParseStatus } = useFileParse();

	const clearAndResetParseStatus = () => {
		onClear();
		setParseStatus("idle");
	};
	return (
		<div>
			<div>
				{file ? (
					<>
						<FileUploadCard
							file={file}
							onClear={clearAndResetParseStatus}
							status={status}
							uploadType={uploadType}
							uploadError={uploadError}
						/>
						<div>{uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}</div>
					</>
				) : (
					<ChooseFileCard handleFileChange={uploadSelectedFiles} uploadRef={uploadRef} />
				)}
				{parseStatus === "error" && (
					<p className="text-red-500 font-medium mt-2">Issue parsing the file, Try again</p>
				)}
			</div>
			<Footer />
		</div>
	);
}

function Footer() {
	return (
		<footer className="fixed z-100 bottom-0 left-0 right-0 flex items-center justify-center border-t border-gray-200">
			<div className="flex w-full justify-between items-center max-w-[600px] py-8">
				<Button variant="outline" className="h-11">
					Upload more
				</Button>
				<Button className="h-11">Parse document</Button>
			</div>
		</footer>
	);
}
