import { Button } from "@/components/ui/button";
import Image from "next/image";

export const metadata = {
	title: "Create New Password Success",
};

export default function Verify() {
	return (
		<main className="max-w-[37.5rem] min-h-dvh grid place-items-center mx-auto px-6 md:px-0 my-10">
			<div className="flex flex-col items-center">
				<Image src="/assets/verification-icon.svg" width={120} height={120} alt="" />

				<p className="text-gray-600 text-sm font-medium text-center text-balance mt-4">
					You have successfully created a new password
				</p>

				<Button className="mt-16" type="submit">
					Continue to sign in
				</Button>
			</div>
		</main>
	);
}
