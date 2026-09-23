export default function Loading() {
	return (
		<main
			aria-label="Loading hospital verification"
			aria-busy="true"
			className="mx-auto my-10 grid min-h-dvh max-w-[37.5rem] place-items-center px-6 md:px-0"
		>
			<div aria-hidden="true" className="flex w-full flex-col items-center">
				<div className="size-30 animate-pulse rounded-full bg-gray-100" />

				<div className="mt-10 h-6 w-48 animate-pulse rounded bg-gray-200" />
				<div className="mt-4 flex w-full flex-col items-center gap-2">
					<div className="h-4 w-full max-w-lg animate-pulse rounded bg-gray-100" />
					<div className="h-4 w-4/5 max-w-md animate-pulse rounded bg-gray-100" />
				</div>

				<section className="mt-8 w-full">
					<div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
						<div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
						<div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
					</div>

					<div className="mt-5 flex flex-col gap-5">
						{["w-32", "w-44", "w-48", "w-36"].map((titleWidth, stepIndex) => (
							<div key={titleWidth} className="relative flex gap-3">
								{stepIndex < 3 ? (
									<div className="absolute top-8 left-4 h-[calc(100%+1.25rem)] w-px bg-gray-100" />
								) : null}

								<div className="relative z-10 size-8 shrink-0 animate-pulse rounded-full bg-gray-100 ring-4 ring-white" />
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between gap-3">
										<div className={`h-4 ${titleWidth} animate-pulse rounded bg-gray-200`} />
										<div className="h-6 w-16 shrink-0 animate-pulse rounded bg-gray-100" />
									</div>
									<div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-gray-100" />
								</div>
							</div>
						))}
					</div>

					<div className="mx-auto mt-10 h-4 w-4/5 max-w-sm animate-pulse rounded bg-gray-100" />
				</section>
			</div>
		</main>
	);
}
