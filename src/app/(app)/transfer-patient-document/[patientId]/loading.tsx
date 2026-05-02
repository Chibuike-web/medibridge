export default function Loading() {
	return (
		<main className="mx-auto my-12 flex w-full max-w-7xl flex-col gap-9 px-6 md:px-0">
			<div className="mx-auto h-8 w-48 animate-pulse rounded bg-gray-100" />

			<section className="rounded-3xl border border-gray-200 bg-white px-6 py-8 shadow-sm">
				<div className="flex flex-wrap items-start justify-between gap-6 border-b border-gray-200 pb-6">
					<div className="space-y-3">
						<div className="h-4 w-44 animate-pulse rounded bg-gray-100" />
						<div className="h-8 w-64 animate-pulse rounded bg-gray-100" />
						<div className="h-4 w-36 animate-pulse rounded bg-gray-100" />
					</div>
					<div className="rounded-2xl bg-gray-50 px-4 py-3">
						<div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
						<div className="mt-2 h-4 w-52 animate-pulse rounded bg-gray-100" />
					</div>
				</div>

				<div className="mt-8 grid gap-6 md:grid-cols-2">
					<div className="rounded-2xl bg-gray-50 px-5 py-4">
						<div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
						<div className="mt-4 h-4 w-48 animate-pulse rounded bg-gray-100" />
						<div className="mt-3 h-4 w-56 animate-pulse rounded bg-gray-100" />
					</div>

					<div className="rounded-2xl bg-gray-50 px-5 py-4">
						<div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
						<div className="mt-4 h-4 w-full animate-pulse rounded bg-gray-100" />
						<div className="mt-3 h-4 w-5/6 animate-pulse rounded bg-gray-100" />
					</div>
				</div>

				<div className="mt-8">
					<div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
					<div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
						<div className="grid grid-cols-2 gap-4 bg-gray-50 px-4 py-3">
							<div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
							<div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
						</div>
						<div className="space-y-3 px-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="h-4 w-44 animate-pulse rounded bg-gray-100" />
								<div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="h-4 w-52 animate-pulse rounded bg-gray-100" />
								<div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
								<div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
