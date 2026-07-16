import { CreateNewPasswordClient } from "./create-new-password-client";

export const metadata = {
	title: "Create New Password",
};

export default function CreateNewPassword() {
	return (
		<main className="max-w-[37.5rem] min-h-dvh grid place-items-center mx-auto">
			<div className="w-full px-6 md:px-0">
				<h1 className="mt-10 text-center text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800">
					Create a New Password
				</h1>
				<p className="text-center mt-4 text-gray-600">
					Choose a strong password to keep your account secure.
				</p>
				<CreateNewPasswordClient />
			</div>
		</main>
	);
}
