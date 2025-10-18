"use client";

import { Button } from "@/components/ui/button";
import Plus from "@/icons/plus";
import { useState } from "react";
import { AnimatePresence } from "motion/react";

import { FileUploadProvider } from "../../../context/file-upload";
import FileParseProvider from "../../../context/file.parse";
import PatientFileUploadModal from "./patient-file-upload-modal";

export default function DashboardClient() {
	const [isUploadPatientModalOpen, setIsUploadPatientModalOpen] = useState(false);
	return (
		<div className="w-full mx-auto max-w-[1440px] flex items-center justify-center h-full p-10">
			<div className="flex flex-col items-center max-w-[355px]">
				<h1 className="font-semibold text-[24px] text-center mb-6">No patients yet</h1>
				<p className="mb-12 text-center">
					You haven’t added any patients to your list. Start by creating a new patient profile.
				</p>
				<Button onClick={() => setIsUploadPatientModalOpen(true)}>
					<Plus /> Add new patient
				</Button>
			</div>
			<AnimatePresence>
				{isUploadPatientModalOpen && (
					// <UploadPatientModal setIsUploadPatientModalOpen={setIsUploadPatientModalOpen} />

					<FileUploadProvider>
						<FileParseProvider>
							<PatientFileUploadModal setIsUploadPatientModalOpen={setIsUploadPatientModalOpen} />
						</FileParseProvider>
					</FileUploadProvider>
				)}
			</AnimatePresence>
		</div>
	);
}
