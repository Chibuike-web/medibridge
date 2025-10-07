"use client";

import UploadCloudLine from "@/icons/upload-cloud-line";
import { Button } from "./ui/button";

export default function FileUploadIdle() {
	return (
		<div className="relative w-full flex flex-col items-center p-8 border border-dashed border-gray-200 gap-[20px] rounded-[8px] mt-[12px]">
			<UploadCloudLine className="text-gray-600 size-5" />
			<div className="flex flex-col gap-[6px] items-center">
				<p className="font-medium text-gray-800 text-[14px]">
					Choose a file or drag & drop it here.
				</p>
				<p className="text-gray-600 text-[12px]">JPEG, PNG, and PDF, up to 50 MB.</p>
			</div>
			<Button variant="outline">Browse File</Button>
			<input type="file" className="opacity-0 absolute inset-0" />
		</div>
	);
}
