import ArrowLeftLongLine from "@/icons/arrow-left-long-line";

import Link from "next/link";
import HospitalUploadClient from "./hospital-upload-client";
export default function Upload() {
	return (
		<div className="px-6 xl:px-0">
			<div className="max-w-[800px] mx-auto py-8">
				<Link href="/hospital-details" className="flex items-center gap-2 w-max">
					<ArrowLeftLongLine className="size-5" /> <span>Back</span>
				</Link>
			</div>
			<div className="max-w-[550px] mx-auto">
				<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] my-10">
					Hospital Upload
				</h1>
				<HospitalUploadClient />
			</div>
		</div>
	);
}
