export default function Loading() {
	return (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-200 bg-white px-8 h-16 flex items-center sticky top-0 z-20 shrink-0">
				{/* Title */}
				<div className="h-6 w-32 animate-pulse rounded bg-gray-100" />

				<div className="ml-auto flex items-center gap-2 flex-1 justify-end">
					<div className="h-10 w-[20rem] animate-pulse rounded bg-gray-100" />

					<div className="h-10 w-10 animate-pulse rounded bg-gray-100" />

					<div className="h-10 w-24 animate-pulse rounded bg-gray-100" />

					<div className="h-10 w-44 animate-pulse rounded bg-gray-100" />
				</div>
			</header>
		</div>
	);
}
