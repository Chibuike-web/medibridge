"use client";

import "@/styles/globals.css";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
	error,
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<html lang="en">
			<body className="antialiased">
				<title>Something went wrong | Medibridge</title>
				<main className="grid min-h-dvh place-items-center px-6 py-10">
					<section className="w-full max-w-[31.25rem] text-center">
						<h1 className="text-lg font-semibold tracking-[-0.015em] text-gray-800 text-balance">
							Something went wrong
						</h1>
						<p className="mx-auto mt-4 max-w-md text-sm text-gray-600 text-pretty">
							Medibridge couldn’t load. Try again, and if the problem continues, contact support.
						</p>
						<Button className="mt-12" onClick={() => retry()}>
							Try again
						</Button>
					</section>
				</main>
			</body>
		</html>
	);
}
