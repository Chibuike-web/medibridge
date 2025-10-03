"use client";

import FileUploadIdle from "@/components/ui/file-upload-idle";
import CloseLine from "@/icons/close-line";
import MotionDiv from "@/lib/motion-wrapper";
import FileUploadProgress from "@/components/ui/file-upload-progress";

type UploadPatientModalPropsType = {
	setIsUploadPatientModalOpen: (value: boolean) => void;
};

export default function UploadPatientModal({
	setIsUploadPatientModalOpen,
}: UploadPatientModalPropsType) {
	return (
		<div
			className="bg-foreground/80 fixed inset-0 backdrop-blur-[4px] flex items-center justify-center "
			onClick={() => setIsUploadPatientModalOpen(false)}
		>
			<MotionDiv
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
				transition={{ duration: 0.2 }}
				onClick={(e) => e.stopPropagation()}
				className="bg-white max-w-[600px] w-full p-6 rounded-[24px]"
			>
				<div className="flex justify-between items-center">
					<h1 className="text-[24px] font-semibold">Upload Patient's Record</h1>
					<button onClick={() => setIsUploadPatientModalOpen(false)}>
						<CloseLine className="size-8" />
					</button>
				</div>
				<p className="text-gray-600 mt-[14px]">
					Upload a document containing patient information. Supported formats: PDF, PNG, JPG, DOCX.
				</p>
				<FileUploadIdle />
				<FileUploadProgress />
			</MotionDiv>
		</div>
	);
}
