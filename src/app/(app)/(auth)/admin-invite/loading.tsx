export default function Loading() {
	return (
		<main
			aria-label="Loading administrator invitation"
			aria-busy="true"
			className="mx-auto my-10 grid min-h-dvh max-w-[37.5rem] place-items-center px-6 md:px-0"
		>
			<div aria-hidden="true" className="w-full">
				<div className="mx-auto mt-10 h-6 w-48 animate-pulse rounded bg-gray-200" />
				<div className="mt-4 flex flex-col items-center gap-2">
					<div className="h-4 w-full max-w-lg animate-pulse rounded bg-gray-100" />
					<div className="h-4 w-4/5 max-w-md animate-pulse rounded bg-gray-100" />
				</div>

				<div className="mt-12">
					<div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
					<div className="mt-2 h-9 w-full animate-pulse rounded-md bg-gray-100" />

					<div className="mt-6 h-4 w-24 animate-pulse rounded bg-gray-200" />
					<div className="mt-2 h-9 w-full animate-pulse rounded-md bg-gray-100" />
					<div className="mt-2 h-4 w-64 max-w-full animate-pulse rounded bg-gray-100" />

					<div className="mt-16 h-9 w-full animate-pulse rounded-md bg-gray-200" />
				</div>
			</div>
		</main>
	);
}
