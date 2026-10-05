import { OwnerClient } from "./owner-client";

export const metadata = {
	title: "Register",
};

export default function Owner() {
	return (
		<main className="max-w-[37.5rem] min-h-dvh grid place-items-center mx-auto px-6 md:px-0 my-10">
			<div className="w-full">
				<OwnerClient />
			</div>
		</main>
	);
}
