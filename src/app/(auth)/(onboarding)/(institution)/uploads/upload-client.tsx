"use client";

import { Button } from "@/components/ui/button";
import FileUploadIdle from "@/components/file-upload-idle";
import { useRouter } from "next/navigation";

export default function UploadClient() {
	const router = useRouter();
	return (
		<form
			className="w-full"
			onSubmit={(e) => {
				e.preventDefault();
				router.push("/admin");
			}}
		>
			<p className="text-gray-600">Upload hospital accreditation or official license document</p>
			<FileUploadIdle />
			<Button className="w-full h-11 mt-12" type="submit">
				Continue
			</Button>
		</form>
	);
}
