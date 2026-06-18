import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { getTransfers } from "@/lib/api/get-transfers";
import { TransfersClient } from "./transfers-client";
import { endOfDay, startOfDay } from "date-fns";
import { parseDateParam } from "@/lib/utils/parse-date-param";

export const metadata = {
	title: "Transfers",
};

export default async function Transfers({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { page, limit, query, requestedFrom, requestedTo } = await searchParams;
	const currentPage = typeof page === "string" ? parseInt(page, 10) : 1;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : 14;
	const currentQuery = typeof query === "string" ? query : "";
	const currentRequestedFrom = typeof requestedFrom === "string" ? requestedFrom : "";
	const currentRequestedTo = typeof requestedTo === "string" ? requestedTo : "";
	const requestedAtFilter = {
		from: parseRequestedAtDateParam(currentRequestedFrom, "start"),
		to: parseRequestedAtDateParam(currentRequestedTo, "end"),
	};
	const { hasTransfers, transfers, totalTransfers } = await getTransfers(
		currentPage,
		currentLimit,
		currentQuery,
		requestedAtFilter,
	);
	const totalPages = Math.max(1, Math.ceil(totalTransfers / currentLimit));

	return hasTransfers ? (
		<TransfersClient
			transfers={transfers}
			page={currentPage}
			limit={currentLimit}
			totalPages={totalPages}
			searchQuery={currentQuery}
			requestedFrom={currentRequestedFrom}
			requestedTo={currentRequestedTo}
		/>
	) : (
		<div className="w-full mx-auto max-w-7xl flex items-center justify-center h-full p-10">
			<div className="relative flex w-[31.25rem] max-w-full items-end justify-center">
				<Image
					src="/assets/empty-state.svg"
					alt=""
					aria-hidden="true"
					width={500}
					height={336}
					className="h-auto w-[31.25rem] max-w-full"
				/>
				<div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center text-center">
					<h1 className="font-semibold text-2xl text-center mb-6">No transfers yet</h1>
					<p className="mb-12 text-center">
						Start by creating your first transfer request to move patients securely.
					</p>
					<Button className="h-11" asChild>
						<Link href="/dashboard/new-transfer-request">Create transfer request </Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

function parseRequestedAtDateParam(value: string, boundary: "start" | "end") {
	const date = parseDateParam(value);
	if (!date) return undefined;

	return boundary === "start" ? startOfDay(date) : endOfDay(date);
}
