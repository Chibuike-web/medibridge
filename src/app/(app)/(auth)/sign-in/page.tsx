import Link from "next/link";
import { SignInClient } from "./sign-in-client";

export const metadata = {
	title: "Sign in",
};

export default function SignIn() {
	return (
		<main className="max-w-[37.5rem] min-h-dvh grid place-items-center mx-auto px-6 md:px-0 my-10">
			<div className="w-full">
				<h1 className="mt-10 text-center text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800">
					Welcome Back to MediBridge
				</h1>
				<p className="text-gray-600 text-sm font-medium text-center text-balance mt-4">
					Sign in with your verified hospital credentials.
				</p>
				<SignInClient />
				<p className="text-center mt-4 text-sm font-medium">
					<span className="text-gray-600">Do not have an account? </span>
					<Link href="/owner" className="font-medium underline underline-offset-3 text-gray-800">
						Create an account
					</Link>
				</p>
			</div>
		</main>
	);
}
