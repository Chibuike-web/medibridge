import ArrowLeftLongLine from "@/icons/arrow-left-long-line";
import Link from "next/link";
import ForgotPasswordClient from "./forgot-password-client";

export default function ForgotPassword() {
	return (
		<div className="px-6 xl:px-0">
			<div className="max-w-[800px] mx-auto py-8">
				<Link href="/uploads" className="flex items-center gap-2 w-max">
					<ArrowLeftLongLine className="size-5" /> <span>Back</span>
				</Link>
			</div>
			<div className="max-w-[550px] mx-auto">
				<div className="mb-12">
					<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] mt-10">
						Forgot Your Password?
					</h1>
					<p className="text-center mt-5 text-gray-600 font-medium">
						We’ll send a link to reset your password.
					</p>
				</div>
				<ForgotPasswordClient />
			</div>
		</div>
	);
}
