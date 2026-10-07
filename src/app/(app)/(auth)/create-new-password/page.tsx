import { Suspense } from "react";
import { CreateNewPasswordClient } from "./create-new-password-client";

export const metadata = {
	title: "Create New Password",
};

type CreateNewPasswordProps = {
	searchParams: Promise<{ token?: string | string[]; error?: string | string[] }>;
};

export default function CreateNewPassword({ searchParams }: CreateNewPasswordProps) {
	return (
		<main className="h-dvh overflow-y-auto">
			<div className="max-w-[31.25rem] min-h-full grid place-items-center mx-auto px-6 md:px-0 py-10">
				<Suspense>
					{searchParams.then(({ token, error }) => {
						const resetToken = Array.isArray(token) ? token[0] : token;
						const resetError = Array.isArray(error) ? error[0] : error;
						return (
							<CreateNewPasswordClient
								token={resetToken ?? null}
								isTokenInvalid={resetError === "INVALID_TOKEN"}
							/>
						);
					})}
				</Suspense>
			</div>
		</main>
	);
}
