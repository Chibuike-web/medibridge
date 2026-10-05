import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
	title: "Forgot Password Verify",
};

export default function Verify() {
	return (
		<main className="max-w-[31.25rem] min-h-dvh grid place-items-center mx-auto px-6 md:px-0 my-10">
			<div className="flex flex-col items-center">
				<Image src="/assets/verification-icon.svg" width={120} height={120} alt="" />

				<p className="text-gray-600 text-sm font-medium text-center text-balance mt-4">
					If your email is associated with a MediBridge account, you’ll receive a reset link
					shortly.
				</p>
				<Button asChild className="mt-16 w-full">
					<Link href="/sign-in">Back to sign in</Link>
				</Button>
				<Link href="/forgot-password" className="mt-4 text-sm text-gray-600 underline">
					Try another email
				</Link>
			</div>
		</main>
	);
}
