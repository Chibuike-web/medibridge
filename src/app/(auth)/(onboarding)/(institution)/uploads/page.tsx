import ArrowLeftLongLine from "@/icons/arrow-left-long-line";
import UploadClient from "./upload-client";

import Link from "next/link";
export default function Uploads() {
	return (
		<div className="px-6 xl:px-0">
			<div className="max-w-[800px] mx-auto py-8">
				<Link href="/info" className="flex gap-2 w-max">
					<ArrowLeftLongLine className="size-5" /> <span>Back</span>
				</Link>
			</div>
			<div className="max-w-[550px] mx-auto">
				<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] my-10">
					Institution Details
				</h1>
				<UploadClient />
			</div>
		</div>
	);
}
