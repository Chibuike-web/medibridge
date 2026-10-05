import { Suspense } from "react";
import { SignInClient } from "./sign-in-client";

export const metadata = {
	title: "Sign in",
};

export default function SignIn() {
	return (
		<main className="max-w-[31.25rem] min-h-dvh grid place-items-center mx-auto px-6 md:px-0 my-10">
			<div className="w-full">
				<Suspense>
					<SignInClient />
				</Suspense>
			</div>
		</main>
	);
}
