export function TransfersPageSkeleton() {
	return (
		<div className="flex h-full flex-col">
			<header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-6">
				<div className="h-6 w-32 animate-pulse rounded bg-gray-100" />

				<div className="ml-auto flex flex-1 items-center justify-end gap-2">
					<div className="h-10 w-[20rem] animate-pulse rounded bg-gray-100" />
					<div className="h-10 w-10 animate-pulse rounded bg-gray-100" />
					<div className="h-10 w-24 animate-pulse rounded bg-gray-100" />
					<div className="h-10 w-44 animate-pulse rounded bg-gray-100" />
				</div>
			</header>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
					<TableLoadingSkeleton />
				</section>
			</div>
		</div>
	);
}

export default function Loading() {
	return <TransfersPageSkeleton />;
}

function TableLoadingSkeleton() {
	const gridColumns = "grid-cols-[2.5rem_1.4fr_8rem_1.5fr_8rem_8rem_3rem]";

	return (
		<div className="overflow-x-auto rounded-xl border border-gray-200 text-sm">
			<div className="min-w-[72rem] bg-white">
				<div className={`grid h-12 ${gridColumns} items-center gap-3 bg-gray-50 px-3`}>
					{Array.from({ length: 7 }).map((_, index) => (
						<div key={index} className="h-4 animate-pulse rounded bg-gray-200" />
					))}
				</div>
				<div>
					{Array.from({ length: 8 }).map((_, rowIndex) => (
						<div
							key={rowIndex}
							className={`grid min-h-14 ${gridColumns} items-center gap-3 border-b border-gray-200 px-3 last:border-b-0`}
						>
							{Array.from({ length: 7 }).map((_, cellIndex) => (
								<div key={cellIndex} className="h-4 animate-pulse rounded bg-gray-100" />
							))}
						</div>
					))}
				</div>
				<div className="flex min-h-14 items-center justify-between gap-3 border-t border-gray-200 bg-white p-3">
					<div className="flex items-center gap-3">
						<div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
						<div className="h-8 w-[4.25rem] animate-pulse rounded-md bg-gray-200" />
					</div>
					<div className="flex items-center gap-3">
						<div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
						<div className="h-8 w-20 animate-pulse rounded-md bg-gray-200" />
						<div className="h-8 w-14 animate-pulse rounded-md bg-gray-200" />
					</div>
				</div>
			</div>
		</div>
	);
}
