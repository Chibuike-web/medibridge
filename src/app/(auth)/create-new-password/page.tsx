import CreateNewPasswordClient from "./create-new-password-client";

export default function CreateNewPassword() {
	return (
		<main className="max-w-[550px] min-h-dvh grid place-items-center mx-auto">
			<div className="w-full px-6 xl:px-0">
				<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] mt-10">
					Create a New Password
				</h1>
				<p className="text-center mt-4 text-gray-600">
					Choose a strong password to keep your account secure.{" "}
				</p>
				<CreateNewPasswordClient />
			</div>
		</main>
	);
}
