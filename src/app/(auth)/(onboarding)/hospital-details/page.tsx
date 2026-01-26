import Link from "next/link";
import ArrowLeftLine from "@/icons/arrow-left-line";
import { HospitalDetailsClient } from "./hospital-details-client";

export default function HospitalDetails() {
	return (
		<main>
			<nav className="w-full h-16 flex items-center sticky top-0 bg-white border-b border-gray-300 px-8">
				<Link href="/owner" className="flex gap-2 w-max items-center text-foreground">
					<ArrowLeftLine className="size-5" /> <span className="sr-only">Back</span>
				</Link>
			</nav>
			<div className="max-w-[600px] mx-auto  min-h-[calc(100dvh-90px)] grid place-items-center">
				<div className="w-full px-6 md:px-0">
					<div className="mb-10">
						<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] mb-4">
							Hospital Details
						</h1>
						<p className="text-center text-gray-600">
							Fill in your hospital’s registered details and provide an accreditation or license for
							verification.
						</p>
					</div>
					<HospitalDetailsClient />
				</div>
			</div>
		</main>
	);
}
