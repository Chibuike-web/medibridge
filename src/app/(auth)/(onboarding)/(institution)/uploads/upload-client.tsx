"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, CloudUpload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UploadClient() {
	const router = useRouter();
	return (
		<div className="px-6 xl:px-0">
			<div className="max-w-[800px] mx-auto py-8">
				<Link href="/info" className="flex gap-2">
					<ArrowLeft /> <span>Back</span>
				</Link>
			</div>
			<div className="max-w-[550px] mx-auto">
				<h1 className="text-[1.8rem] text-center font-semibold leading-[1.2] my-10">
					Institution Details
				</h1>
				<form
					className="w-full"
					onSubmit={(e) => {
						e.preventDefault();
						router.push("/admin");
					}}
				>
					<p>Upload hospital accreditation or official license document</p>
					<div className="relative w-full flex flex-col items-center p-8 border border-dashed border-gray-200 gap-[20px] rounded-[8px] mt-[12px]">
						<CloudUpload className="text-gray-600" />
						<div className="flex flex-col gap-[6px] items-center">
							<p className="font-medium text-gray-800 text-[14px]">
								Choose a file or drag & drop it here.
							</p>
							<p className="text-gray-600 text-[12px]">JPEG, PNG, and PDF, up to 50 MB.</p>
						</div>
						<Button variant="outline">Browse File</Button>
						<input type="file" className="opacity-0 absolute inset-0" />
					</div>
					<Button className="w-full h-11 mt-12" type="submit">
						Continue
					</Button>
				</form>
			</div>
		</div>
	);
}
