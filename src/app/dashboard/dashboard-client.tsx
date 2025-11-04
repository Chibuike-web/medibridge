"use client";

import { Button } from "@/components/ui/button";
import Plus from "@/icons/plus";

import PatientFileUploadModal from "./patient-file-upload-modal";
import { useModal } from "@/store/use-modal-store";

export default function DashboardClient() {
	const { isOpen, setIsOpen } = useModal();

	return (
		<div className="w-full mx-auto max-w-[1440px] flex items-center justify-center h-full p-10">
			<div className="flex flex-col items-center max-w-[355px]">
				<h1 className="font-semibold text-[24px] text-center mb-6">No patients yet</h1>
				<p className="mb-12 text-center">
					You haven’t added any patients to your list. Start by creating a new patient profile.
				</p>

				<Button onClick={() => setIsOpen(true)}>
					<Plus /> Add new patient
				</Button>
			</div>
			{isOpen && <PatientFileUploadModal />}
		</div>
	);
}
