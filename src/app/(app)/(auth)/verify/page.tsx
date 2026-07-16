import Image from "next/image";
import { VerifyClient } from "./verify-client";

export const metadata = {
	title: "Verify",
};

export default function Verify() {
	return (
		<main className="max-w-[37.5rem] min-h-dvh grid place-items-center mx-auto px-6 md:px-0 my-10">
			<div className="flex flex-col items-center">
				<Image src="/assets/verification-icon.svg" width={160} height={160} alt="" />

				<h1 className="mt-10 text-center text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800">
					Verification In Progress
				</h1>
				<p className="text-gray-600 font-medium text-center mt-6">
					Your account has been created. Please check your email to verify your address while we
					review your hospital’s accreditation. Once the hospital verification is complete, you’ll
					be prompted to sign in to create admin.
				</p>
				<VerifyClient />
			</div>
		</main>
	);
}

