function CardSkeleton() {
	return (
		<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
			<div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
			<div className="mt-4 h-10 w-32 animate-pulse rounded bg-gray-100" />
			<div className="mt-4 border-t border-gray-100 pt-4">
				<div className="h-4 w-full animate-pulse rounded bg-gray-100" />
			</div>
		</div>
	);
}

export default function Loading() {
	return (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-100 bg-white sticky top-0 z-20 shrink-0">
				<div className="flex h-16 items-center px-8">
					<div className="h-6 w-32 animate-pulse rounded bg-gray-100" />
				</div>
			</header>

			<div className="mx-auto grid w-full max-w-7xl gap-4 px-6 py-8 lg:grid-cols-3 lg:px-10">
				<CardSkeleton />
				<CardSkeleton />
				<CardSkeleton />
			</div>
		</div>
	);
}
