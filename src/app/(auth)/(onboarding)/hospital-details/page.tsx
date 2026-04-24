import Link from "next/link";
import { HospitalDetailsClient } from "./hospital-details-client";
import { RiArrowLeftLine } from "@remixicon/react";

export default function HospitalDetails() {
	return (
		<>
			<nav className="w-full h-16 flex items-center sticky top-0 bg-white border-b border-gray-300 px-8">
				<Link href="/owner" className="flex gap-2 w-max items-center text-foreground">
					<RiArrowLeftLine className="size-5" /> <span className="sr-only">Back</span>
				</Link>
			</nav>
			<main className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[37.5rem] place-items-center my-10">
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
			</main>
		</>
	);
}

