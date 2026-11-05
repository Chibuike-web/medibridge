import { ForgotPasswordClient } from "./forgot-password-client";

export const metadata = {
	title: "Forgot Password",
};

export default function ForgotPassword() {
	return (
		<main className="h-dvh overflow-y-auto">
			<div className="max-w-[31.25rem] min-h-full grid place-items-center mx-auto px-6 md:px-0 py-10">
				<div className="w-full">
					<ForgotPasswordClient />
				</div>
			</div>
		</main>
	);
}
