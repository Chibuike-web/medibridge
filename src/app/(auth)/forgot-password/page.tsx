import Link from "next/link";
import ForgotPasswordClient from "./forgot-password-client";
import ArrowLeftLine from "@/icons/arrow-left-line";

export default function ForgotPassword() {
	return (
		<main>
			<nav className="w-full h-16 flex items-center sticky top-0 bg-white border-b border-gray-300 px-8">
				<Link href="/sign-in" className="flex gap-2 w-max items-center text-foreground">
					<ArrowLeftLine className="size-5" /> <span className="sr-only">Back</span>
				</Link>
			</nav>

			<div className="max-w-[600px] mx-auto min-h-[calc(100dvh-90px)] grid place-items-center px-6 md:px-0">
				<div className="w-full">
					<div>
						<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] ">
							Forgot Your Password?
						</h1>
						<p className="text-center mt-4 text-gray-600 font-medium">
							We’ll send a link to reset your password.
						</p>
					</div>
					<ForgotPasswordClient />
				</div>
			</div>
		</main>
	);
}
