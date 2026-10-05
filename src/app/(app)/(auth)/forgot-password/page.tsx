import Link from "next/link";
import { ForgotPasswordClient } from "./forgot-password-client";
import { RiArrowLeftLine } from "@remixicon/react";

export const metadata = {
	title: "Forgot Password",
};

export default function ForgotPassword() {
	return (
		<main>
			<nav className="w-full h-16 flex items-center sticky top-0 bg-white border-b border-gray-300 px-8">
				<Link href="/sign-in" className="flex gap-2 w-max items-center text-foreground">
					<RiArrowLeftLine className="size-4" /> <span className="sr-only">Back</span>
				</Link>
			</nav>

			<div className="max-w-[31.25rem] min-h-[calc(100dvh-4rem)] grid place-items-center mx-auto px-6 md:px-0 my-10">
				<div className="w-full">
					<div>
						<h1 className="text-center text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800">
							Forgot Your Password?
						</h1>
						<p className="text-gray-600 text-sm font-medium text-center text-balance mt-4">
							We’ll send a link to reset your password.
						</p>
					</div>
					<ForgotPasswordClient />
				</div>
			</div>
		</main>
	);
}
