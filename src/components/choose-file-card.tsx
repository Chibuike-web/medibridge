import { UploadCloudLine } from "@/icons/upload-cloud-line";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { ChangeEvent, RefObject } from "react";
import { cn } from "@/lib/utils/cn";

type ChooseFileCardPropsType = {
	handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
	fileInputRef: RefObject<HTMLInputElement | null>;
	error?: string;
	errorId?: string;
};

export function ChooseFileCard({
	handleFileChange,
	fileInputRef,
	error,
	errorId,
}: ChooseFileCardPropsType) {
	return (
		<div
			className={cn(
				"relative w-full flex flex-col items-center",
				" p-8 border border-dashed border-gray-200 gap-5 rounded-[8px]",
				error && "border-red-500",
			)}
		>
			<Label htmlFor="file-upload">
				<input
					type="file"
					id="file-upload"
					ref={fileInputRef}
					onChange={handleFileChange}
					className="opacity-0 absolute inset-0"
					multiple
					aria-invalid={!!error}
					aria-describedby={error ? errorId : undefined}
					aria-label="Upload hospital accreditation or license document"
				/>
			</Label>
			<UploadCloudLine className="text-gray-600 size-5" />
			<div className="flex flex-col gap-1.5 items-center">
				<p className="font-medium text-gray-800 text-[14px] text-center">
					Choose a file or drag & drop it here.
				</p>
				<p className="text-gray-600 text-[12px] text-center">JPEG, PNG, and PDF, up to 50 MB.</p>
			</div>
			<Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()}>
				Browse File
			</Button>
		</div>
	);
}
