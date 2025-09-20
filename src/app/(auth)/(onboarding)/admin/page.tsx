import AdminClient from "./admin-client";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

export default function Admin() {
	return (
		<div className="px-6 xl:px-0">
			<div className="max-w-[800px] mx-auto py-8">
				<Link href="/uploads" className="flex gap-2 w-max">
					<ArrowLeft /> <span>Back</span>
				</Link>
			</div>
			<div className="max-w-[550px] mx-auto">
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
		</div>
	);
}
