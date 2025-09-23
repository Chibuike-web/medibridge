"use client"

import LoginClient from "./login-client";

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

				<LoginClient />
			</div>
		</main>
	);
}
