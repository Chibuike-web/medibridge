"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import ChooseFileCard from "@/components/choose-file-card";
import FileUploadCard from "@/components/file-upload-card";
import useVerificationFileUpload from "@/hooks/use-verification-file-upload";

export default function HospitalUploadClient() {
	const router = useRouter();
	const { file, status, uploadType, uploadError, uploadRef, onClear, handleFileChange } =
		useVerificationFileUpload();
	return (
		<form
			className="w-full"
			onSubmit={(e) => {
				e.preventDefault();
				router.push("/admin");
			}}
		>
			<p className="text-gray-600 mb-4">
				Upload hospital accreditation or official license document
			</p>
			{file ? (
				<FileUploadCard
					file={file}
					onClear={onClear}
					status={status}
					uploadType={uploadType}
					uploadError={uploadError}
				/>
			) : (
				<ChooseFileCard handleFileChange={handleFileChange} uploadRef={uploadRef} />
			)}
			<Button className="w-full h-11 mt-12" type="submit">
				Continue
			</Button>
		</form>
	);
}
