export default function Loading() {
	return (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-200 bg-white">
				<div className="mx-auto flex w-full max-w-7xl items-center px-6 py-5 lg:px-10">
					<div className="space-y-2">
						<div className="h-8 w-36 animate-pulse rounded bg-gray-100" />
						<div className="h-4 w-72 animate-pulse rounded bg-gray-100" />
					</div>
				</div>
			</header>
		</div>
	);
}
