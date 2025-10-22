import Link from "next/link";
import ArrowLeftLongLine from "@/icons/arrow-left-long-line";
import HospitalDetailsClient from "./hospital-details-client";

export default function Info() {
	return (
		<main>
			<nav className="w-full  py-8 sticky top-0 bg-white border-b border-gray-300 px-6 xl:px-0">
				<div className="max-w-[800px] mx-auto">
					<Link href="/" className="flex gap-2 w-max items-center text-foreground">
						<ArrowLeftLongLine className="size-5" /> <span>Back</span>
					</Link>
				</div>
			</nav>
			<div className="max-w-[550px] mx-auto mb-20 px-6 xl:px-0">
				<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] my-10">
					Hospital Details
				</h1>
				<HospitalDetailsClient />
			</div>
		</main>
	);
}
