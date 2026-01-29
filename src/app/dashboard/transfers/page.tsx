import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import TransfersClient from "./transfers-client";
import Link from "next/link";

export default function Transfers() {
	return (
		<DashboardLayout>
			<main className="h-full">
				<nav>sds</nav>
				<div className="w-full mx-auto max-w-[1440px] flex items-center justify-center h-full p-10">
					<div className="flex flex-col items-center max-w-[355px]">
						<h1 className="font-semibold text-[24px] text-center mb-6">No transfers yet</h1>
						<p className="mb-12 text-center">
							Start by creating your first transfer request to move patient records securely.
						</p>

						<Button className="h-11" asChild>
							<Link href="/dashboard/new-transfer-request">Create transfer request </Link>
						</Button>
					</div>
					<TransfersClient />
				</div>
			</main>
		</DashboardLayout>
	);
}
