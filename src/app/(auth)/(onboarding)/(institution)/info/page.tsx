import InfoClient from "./info-client";
import Link from "next/link";
import ArrowLeftLongLine from "@/icons/arrow-left-long-line";

export default function Info() {
	return (
		<div className="px-6 xl:px-0">
			<div className="max-w-[800px] mx-auto py-8">
				<Link href="/" className="flex gap-2 w-max items-center text-foreground">
					<ArrowLeftLongLine className="size-5" /> <span>Back</span>
				</Link>
			</div>
			<div className="max-w-[550px] mx-auto">
				<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] my-10">
					Institution Details
				</h1>
				<InfoClient />
			</div>
		</div>
	);
}
