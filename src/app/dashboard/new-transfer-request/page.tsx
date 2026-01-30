import ArrowLeftLine from "@/icons/arrow-left-line";
import Link from "next/link";
import NewTransferRequestClient from "./new-transfer-request-client";

export default function NewTransferRequest() {
	return (
		<main>
			<nav className="w-full h-16 flex items-center sticky z-1 top-0 bg-white border-b border-gray-300 px-8">
				<Link href="/dashboard/transfers" className="flex gap-2 w-max items-center text-foreground">
					<ArrowLeftLine className="size-5" /> <span className="sr-only">Back</span>
				</Link>
			</nav>

			<div className="flex flex-col gap-9 my-12 max-w-[600px] w-full mx-auto px-6 md:px-0">
				<h1 className="font-semibold text-[24px] text-center">New Transfer Request</h1>
				<NewTransferRequestClient />
			</div>
		</main>
	);
}
