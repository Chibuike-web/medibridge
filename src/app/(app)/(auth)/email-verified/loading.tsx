export default function Loading() {
	return (
		<main
			aria-label="Loading email verification"
			aria-busy="true"
			className="mx-auto my-10 grid min-h-dvh max-w-[37.5rem] place-items-center px-6 md:px-0"
		>
			<div aria-hidden="true" className="flex w-full flex-col items-center">
				<div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
				<div className="mt-4 flex w-full flex-col items-center gap-2">
					<div className="h-4 w-4/5 animate-pulse rounded bg-gray-100" />
					<div className="h-4 w-3/5 animate-pulse rounded bg-gray-100" />
				</div>
				<div className="mt-6 h-10 w-28 animate-pulse rounded-md bg-gray-200" />
			</div>
		</main>
	);
}
