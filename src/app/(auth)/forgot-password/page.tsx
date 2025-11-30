import ArrowLeftLongLine from "@/icons/arrow-left-line";
import Link from "next/link";
import ForgotPasswordClient from "./forgot-password-client";

export default function ForgotPassword() {
	return (
		<main>
			<nav className="w-full py-8 sticky top-0 bg-white border-b border-gray-300 px-6 xl:px-0">
				<div className="max-w-[800px] mx-auto">
					<Link href="/" className="flex gap-2 w-max items-center text-foreground">
						<ArrowLeftLongLine className="size-5" /> <span>Back</span>
					</Link>
				</div>
			</nav>

			<div className="max-w-[550px] mx-auto min-h-[calc(100dvh-90px)] grid place-items-center px-6 xl:px-0">
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
