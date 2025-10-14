"use client";

import CloseLine from "@/icons/close-line";
import MotionDiv from "@/lib/motion-wrapper";
import useFileUpload from "@/hooks/use-file-upload";
import FileUploadCard from "./file-upload-card";
import ChooseFileCard from "./choose-file-card";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import LoaderLine from "@/icons/loader-line";

type UploadPatientModalPropsType = {
	setIsUploadPatientModalOpen: (value: boolean) => void;
};

const modalVariants = {
	hidden: { opacity: 0, scale: 0.9 },
	visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
	exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

export default function UploadPatientModal({
	setIsUploadPatientModalOpen,
}: UploadPatientModalPropsType) {
	const { file, status, uploadError, uploadType, onClear, handleFileChange, uploadRef } =
		useFileUpload();

	const hasAnimatedRef = useRef(false);

	useEffect(() => {
		const t = setTimeout(() => {
			hasAnimatedRef.current = true;
		}, 200);
		return () => clearTimeout(t);
	}, []);

	const [isLoading, setIsLoading] = useState(false);

	const parseFile = async () => {
		if (!file) return;

		setIsLoading(true);
		try {
			const res = await fetch("/api/parse-file", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ filename: file.name }),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error("Issue parsing file");
			}
			setIsLoading(false);
			console.log("Parsed info", data);
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div
			className="bg-foreground/80 fixed inset-0 backdrop-blur-[4px] flex items-center justify-center px-6 xl:px-0"
			onClick={() => setIsUploadPatientModalOpen(false)}
		>
			<MotionDiv
				variants={modalVariants}
				initial={hasAnimatedRef.current ? false : "hidden"}
				animate="visible"
				exit="exit"
				onClick={(e) => e.stopPropagation()}
				className="bg-white max-w-[600px] w-full rounded-[24px] flex flex-col"
			>
				<div className="px-6 pt-6 pb-6">
					<div className="flex justify-between items-center">
						<h1 className="text-[clamp(18px,5vw,24px)] font-semibold">Upload Patient's Record</h1>
						<button onClick={() => setIsUploadPatientModalOpen(false)}>
							<CloseLine className="size-8" />
						</button>
					</div>
					<p className="text-gray-600 mt-[14px] mb-6">
						Upload a document containing patient information. Supported formats: PDF, PNG, JPG,
						DOCX.
					</p>
					{file ? (
						<FileUploadCard
							file={file}
							onClear={onClear}
							uploadType={uploadType}
							uploadError={uploadError}
							status={status}
						/>
					) : (
						<ChooseFileCard handleFileChange={handleFileChange} uploadRef={uploadRef} />
					)}
				</div>

				{status === "completed" && (
					<div className="flex items-center justify-between p-6 border-t border-gray-200">
						{isLoading ? (
							<div className="flex items-center justify-center gap-4 self-center justify-self-center w-full">
								<LoaderLine className="animate-spin size-5" />
								<span>Extracting patient data...</span>
							</div>
						) : (
							<>
								<Button variant="outline" className="h-11 cursor-pointer">
									Cancel
								</Button>
								<Button className="h-11 cursor-pointer" onClick={parseFile} disabled={isLoading}>
									Parse Document
								</Button>
							</>
						)}
					</div>
				)}
			</MotionDiv>
		</div>
	);
}
