export default function Loading() {
	return (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-200 bg-white px-8 h-16 flex items-center sticky top-0 z-20 shrink-0">
				<div className="h-6 w-40 animate-pulse rounded bg-gray-100" />
				<div className="ml-auto flex items-center gap-2">
					<div className="h-10 w-[18rem] animate-pulse rounded bg-gray-100" />
					<div className="h-10 w-10 animate-pulse rounded bg-gray-100" />
					<div className="h-10 w-24 animate-pulse rounded bg-gray-100" />
					<div className="h-10 w-40 animate-pulse rounded bg-gray-100" />
				</div>
			</header>
		</div>
	);
}
