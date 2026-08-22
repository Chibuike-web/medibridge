function CardSkeleton() {
	return (
		<div className="rounded-xl bg-gray-50 ring ring-gray-200">
			<div className="flex h-9 items-center px-3">
				<div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
			</div>
			<div className="rounded-xl bg-white px-3 py-4 ring ring-gray-200">
				<div className="h-10 w-20 animate-pulse rounded bg-gray-100" />
				<div className="mt-2 flex items-center gap-2">
					<div className="h-4 w-10 animate-pulse rounded bg-gray-100" />
					<div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
				</div>
			</div>
		</div>
	);
}

function RecentPatientsSkeleton() {
	const gridColumns = "grid-cols-[1.5fr_1fr_0.7fr_4rem_1fr]";

	return (
		<div className="mt-12 max-w-7xl">
			<div className="mb-4 h-5 w-36 animate-pulse rounded bg-gray-200" />
			<div className="overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<div className="min-w-[50rem] bg-white">
					<div className={`grid h-10 ${gridColumns} items-center gap-3 bg-gray-50 px-3`}>
						{["w-28", "w-20", "w-14", "w-8", "w-20"].map((width, index) => (
							<div key={`${width}-${index}`} className={`h-4 ${width} animate-pulse rounded bg-gray-200`} />
						))}
					</div>
					<div>
						{Array.from({ length: 4 }).map((_, rowIndex) => (
							<div
								key={rowIndex}
								className={`grid min-h-14 ${gridColumns} items-center gap-3 border-b border-gray-200 px-3`}
							>
								<div className="flex items-center gap-3">
									<div className="size-9 shrink-0 animate-pulse rounded-full bg-gray-100" />
									<div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
								</div>
								<div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
								<div className="h-4 w-12 animate-pulse rounded bg-gray-100" />
								<div className="h-4 w-6 justify-self-end animate-pulse rounded bg-gray-100" />
								<div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
							</div>
						))}
					</div>
					<div className="flex min-h-14 items-center justify-between gap-3 border-t border-gray-200 bg-white p-3">
						<div className="flex items-center gap-3">
							<div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
							<div className="h-8 w-16 animate-pulse rounded-md bg-gray-200" />
						</div>
						<div className="flex items-center gap-3">
							<div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
							<div className="h-8 w-20 animate-pulse rounded-md bg-gray-200" />
							<div className="h-8 w-14 animate-pulse rounded-md bg-gray-200" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function RecentTransfersSkeleton() {
	const gridColumns = "grid-cols-[1.4fr_1fr_1.5fr_1fr_1fr]";

	return (
		<div className="mt-12 max-w-7xl">
			<div className="mb-4 h-5 w-40 animate-pulse rounded bg-gray-200" />
			<div className="overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<div className="min-w-[50rem] bg-white">
					<div className={`grid h-10 ${gridColumns} items-center gap-3 bg-gray-50 px-3`}>
						{["w-28", "w-20", "w-24", "w-20", "w-24"].map((width, index) => (
							<div key={`${width}-${index}`} className={`h-4 ${width} animate-pulse rounded bg-gray-200`} />
						))}
					</div>
					<div>
						{Array.from({ length: 4 }).map((_, rowIndex) => (
							<div
								key={rowIndex}
								className={`grid min-h-14 ${gridColumns} items-center gap-3 border-b border-gray-200 px-3`}
							>
								<div className="flex items-center gap-3">
									<div className="size-9 shrink-0 animate-pulse rounded-full bg-gray-100" />
									<div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
								</div>
								<div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
								<div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
								<div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
								<div className="h-5 w-24 animate-pulse rounded-full bg-gray-100" />
							</div>
						))}
					</div>
					<div className="flex min-h-14 items-center justify-between gap-3 border-t border-gray-200 bg-white p-3">
						<div className="flex items-center gap-3">
							<div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
							<div className="h-8 w-16 animate-pulse rounded-md bg-gray-200" />
						</div>
						<div className="flex items-center gap-3">
							<div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
							<div className="h-8 w-20 animate-pulse rounded-md bg-gray-200" />
							<div className="h-8 w-14 animate-pulse rounded-md bg-gray-200" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function Loading() {
	return (
		<div className="flex h-full flex-col">
			<header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-6">
				<div className="h-6 w-32 animate-pulse rounded bg-gray-100" />
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto">
				<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
						<CardSkeleton />
						<CardSkeleton />
						<CardSkeleton />
						<CardSkeleton />
					</div>
					<RecentPatientsSkeleton />
					<RecentTransfersSkeleton />
				</section>
			</div>
		</div>
	);
}
