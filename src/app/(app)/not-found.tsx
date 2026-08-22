import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<main className="grid min-h-dvh place-items-center px-6 py-10">
			<section className="w-full max-w-[37.5rem] text-center">
				<p className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">404</p>
				<h1 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-gray-800">Page not found</h1>
				<p className="mx-auto mt-4 max-w-md text-gray-600">
					The page you are looking for does not exist or may have been moved.
				</p>
				<Button asChild className="mt-8">
					<Link href="/">Return home</Link>
				</Button>
			</section>
		</main>
	);
}
