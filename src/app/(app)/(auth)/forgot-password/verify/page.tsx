import { Button } from "@/components/ui/button";
import Image from "next/image";

export const metadata = {
	title: "Forgot Password Verify",
};

export default function Verify() {
	return (
		<main className="max-w-[37.5rem] min-h-dvh grid place-items-center mx-auto px-6 md:px-0 my-10">
			<div className="flex flex-col items-center">
				<Image src="/assets/verification-icon.svg" width={120} height={120} alt="" />

				<p className="text-gray-600 text-sm font-medium text-center text-balance mt-4">
					If your email is associated with a MediBridge account, you’ll receive a reset link
					shortly.
				</p>
				<Button className="mt-16">Open email app</Button>
			</div>
		</main>
	);
}
