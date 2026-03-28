import { Button } from "@/components/ui/button";
import { TransfersClient } from "./transfers-client";
import Link from "next/link";

export default async function Transfers({
	searchParams,
}: {
	searchParams?: Promise<{ preview?: string }>;
}) {
	const params = await searchParams;
	const previewMode = params?.preview === "true";
	return (
		previewMode ? (
			<TransfersClient />
		) : (
			<div className="h-full">
				<div className="w-full mx-auto max-w-[90rem] flex items-center justify-center h-full p-10">
					<div className="flex flex-col items-center max-w-[37.5rem]">
						<h1 className="font-semibold text-2xl text-center mb-6">No transfers yet</h1>
						<p className="mb-12 text-center">
							Start by creating your first transfer request to move patient records securely.
						</p>
						<Button className="h-11" asChild>
							<Link href="/dashboard/new-transfer-request">Create transfer request </Link>
						</Button>
					</div>
				</div>
			</div>
		)
	);
}
