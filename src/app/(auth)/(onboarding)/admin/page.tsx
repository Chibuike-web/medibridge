import ArrowLeftLongLine from "@/icons/arrow-left-long-line";
import AdminClient from "./admin-client";
import Link from "next/link";

export default function Admin() {
	return (
		<main>
			<nav className="w-full  py-8 sticky top-0 bg-white border-b border-gray-300 px-6 xl:px-0">
				<div className="max-w-[800px] mx-auto">
					<Link href="/hospital-upload" className="flex gap-2 w-max items-center text-foreground">
						<ArrowLeftLongLine className="size-5" /> <span>Back</span>
					</Link>
				</div>
			</nav>
			<div className="max-w-[550px] mx-auto px-6 xl:px-0">
				<div className="mb-12">
					<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] mt-10">
						Administrator Account Setup
					</h1>
					<p className="text-center mt-5 text-gray-600">
						Create your institution’s administrator account.
					</p>
					<p className="text-center text-gray-600">
						This user will manage settings and onboard other hospital staff.
					</p>
				</div>
				<AdminClient />
			</div>
		</main>
	);
}
