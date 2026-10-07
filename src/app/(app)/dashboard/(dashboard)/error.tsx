"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
	error,
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	return (
		<section className="mx-auto grid w-full max-w-[31.25rem] place-items-center px-6 py-20 text-center">
			<h1 className="text-xl font-semibold tracking-[-0.015em] text-gray-800 text-balance">
				Something went wrong
			</h1>
			<p className="mt-4 text-sm text-gray-600 text-pretty">
				We couldn’t load this section. Try again, and if the problem continues, contact support.
			</p>
			<Button className="mt-8" onClick={() => retry()}>
				Try again
			</Button>
			{error.digest && (
				<p className="mt-6 text-xs text-gray-400">Error reference: {error.digest}</p>
			)}
		</section>
	);
}
