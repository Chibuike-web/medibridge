"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import ChooseFileCard from "@/components/choose-file-card";
import FileUploadCard from "@/components/file-upload-card";
import useVerificationFileUpload from "@/hooks/use-verification-file-upload";
import { useHospitalStore } from "@/store/use-hospital-store";

export default function HospitalUploadClient() {
	const router = useRouter();
	const {
		file,
		status,
		uploadType,
		setUploadError,
		uploadError,
		uploadRef,
		onClear,
		handleFileChange,
	} = useVerificationFileUpload();
	const { setHospitalInfo } = useHospitalStore();

	return (
		<form
			className="w-full"
			onSubmit={(e) => {
				e.preventDefault();
				if (!file) {
					setUploadError("No file is uploaded. Please upload a file");
					return;
				}
				setHospitalInfo({ file });
				router.push("/admin");
			}}
		>
			<p className="text-gray-600 mb-4 text-center">
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
				<ChooseFileCard
					handleFileChange={handleFileChange}
					uploadRef={uploadRef}
					error={uploadError}
					errorId="file-upload-error"
				/>
			)}
			{uploadError && (
				<p
					id="file-upload-error"
					className="text-red-500 font-medium text-[14px] mt-2"
					role="alert"
				>
					{uploadError}
				</p>
			)}
			<Button className="w-full h-11 mt-12" type="submit">
				Continue
			</Button>
		</form>
	);
}
