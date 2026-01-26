import { OwnerClient } from "./owner-client";

export default function Owner() {
	return (
		<main className="max-w-[600px] mx-auto min-h-dvh grid place-items-center">
			<div className="w-full px-6 md:px-0 ">
				<div className="mb-10">
					<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] mb-4">
						Owner Account Setup
					</h1>
					<p className="text-center text-gray-600">
						Set up the primary owner account for your hospital. This account will manage access and
						invite other members.
					</p>
				</div>
				<OwnerClient />
			</div>
		</main>
	);
}
