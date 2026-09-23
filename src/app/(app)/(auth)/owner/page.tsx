import { OwnerClient } from "./owner-client";

export const metadata = {
	title: "Register",
};

export default function Owner() {
	return (
		<main className="max-w-[37.5rem] min-h-dvh grid place-items-center mx-auto px-6 md:px-0 my-10">
			<div className="w-full">
				<div className="mb-10">
					<h1 className="text-center text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800">
						Owner Account Setup
					</h1>
					<p className="text-gray-600 text-sm font-medium text-center text-balance mt-4">
						Set up the primary owner account for your hospital. This account will manage access and
						invite other members.
					</p>
				</div>
				<OwnerClient />
			</div>
		</main>
	);
}
