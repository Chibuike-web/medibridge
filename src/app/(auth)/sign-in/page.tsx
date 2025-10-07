"use client";

import Link from "next/link";
import SignInClient from "./sign-in-client";

export default function Login() {
	return (
		<main className="max-w-[550px] min-h-dvh grid place-items-center mx-auto">
			<div className="w-full">
				<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] mt-10">
					Welcome Back to MediBridge
				</h1>
				<p className="text-center mt-4 text-gray-600">
					Secure access for verified healthcare institutions.
				</p>

				<SignInClient />
				<p className="text-center mt-4">
					<span>Need an account? </span>
					<Link href="/info" className="font-medium">
						Register
					</Link>
				</p>
			</div>
		</main>
	);
}
