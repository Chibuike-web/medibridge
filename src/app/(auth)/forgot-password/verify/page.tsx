import Image from "next/image";

export default function Verify() {
	return (
		<main className="max-w-[600px] min-h-dvh grid place-items-center mx-auto">
			<div className="flex flex-col items-center">
				<Image src="/assets/verification-icon.svg" width={160} height={160} alt="" />

				<p className="text-gray-600 font-medium text-center mt-6">
					If your email is associated with a MediBridge account, you’ll receive a reset link
					shortly.
				</p>
			</div>
		</main>
	);
}
