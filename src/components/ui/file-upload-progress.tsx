import CloseLine from "@/icons/close-line";
import LoaderLine from "@/icons/loader-line";
import Image from "next/image";
import pdfFileFormat from "@/assets/file-formats/pdf.svg";

export default function FileUploadProgress() {
	return (
		<div className="flex flex-col px-[14px] py-4 border border-gray-200 rounded-[8px]">
			<div className="flex items-center gap-2">
				<Image src={pdfFileFormat} alt="" width={40} height={40} />
				<div className="flex w-full items-start justify-between">
					<div>
						<p className="text-[14px] font-semibold">my-cv.pdf</p>
						<div className="flex items-center gap-1 text-[12px]">
							<div className="flex ">
								<p>0 KB of 120 KB</p> <span>.</span>
							</div>
							<div className="flex items-center gap-1">
								<LoaderLine className="size-4 text-blue-500" />
								<p>Uploading...</p>
							</div>
						</div>
					</div>
					<button>
						<CloseLine className="size-5" />
					</button>
				</div>
			</div>
			<div></div>
		</div>
	);
}
