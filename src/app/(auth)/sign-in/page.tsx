"use client";

import Link from "next/link";
import SignInClient from "./sign-in-client";

export default function Login() {
	return (
		<main className="max-w-[600px] min-h-dvh grid place-items-center mx-auto">
			<div className="w-full px-6 md:px-0">
				<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] mt-10">
					Welcome Back to MediBridge
				</h1>
				<p className="text-center mt-4 text-gray-600">
					Sign in with your verified hospital credentials.
				</p>
				<SignInClient />
				<p className="text-center mt-4 font-medium">
					<span className="text-gray-600">Do not have an account? </span>
					<Link href="/owner" className="font-medium underline underline-offset-3 text-gray-800">
						Create an account
					</Link>
				</p>
			</div>
		</main>
	);
}
