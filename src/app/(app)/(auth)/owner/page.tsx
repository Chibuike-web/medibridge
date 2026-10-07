import { OwnerClient } from "./owner-client";

export const metadata = {
	title: "Register",
};

export default function Owner() {
	return (
		<main className="h-dvh overflow-y-auto">
			<div className="max-w-[31.25rem] min-h-full grid place-items-center mx-auto px-6 md:px-0 py-10">
				<div className="w-full">
					<OwnerClient />
				</div>
			</div>
		</main>
	);
}
