"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
	error,
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	return (
		<main className="grid min-h-dvh place-items-center px-6 py-10">
			<section className="w-full max-w-[31.25rem] text-center">
				<h1 className="text-3xl font-bold tracking-[-0.02em] text-gray-800 text-balance">
					Something went wrong
				</h1>
				<p className="mx-auto mt-4 max-w-md text-gray-600 text-pretty">
					We couldn’t load this page. Try again, and if the problem continues, contact support.
				</p>
				<Button className="mt-8" onClick={() => retry()}>
					Try again
				</Button>
				{error.digest && (
					<p className="mt-6 text-xs text-gray-400">Error reference: {error.digest}</p>
				)}
			</section>
		</main>
	);
}
