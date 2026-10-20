import { ForgotPasswordClient } from "./forgot-password-client";

export const metadata = {
	title: "Forgot Password",
};

export default function ForgotPassword() {
	return (
		<main className="h-dvh overflow-y-auto">
			<div className="max-w-[31.25rem] min-h-full grid place-items-center mx-auto px-6 md:px-0 py-10">
				<div className="w-full">
					<div>
						<h1 className="text-center text-lg font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800 text-balance">
							Forgot Your Password?
						</h1>
						<p className="text-gray-600 text-sm font-normal text-center text-pretty mt-4">
							We’ll send a link to reset your password.
						</p>
					</div>
					<ForgotPasswordClient />
				</div>
			</div>
		</main>
	);
}
