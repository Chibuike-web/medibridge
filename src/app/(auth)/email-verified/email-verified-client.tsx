"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/better-auth/auth.client";

export default function EmailVerifiedClient() {
	const searchParams = useSearchParams();
	const error = searchParams.get("error");
	if (!error) return <Valid />;

	if (error === "no_session") return <NoSession />;

	if (error === "invalid_token" || error === "expired_token") {
		return <InvalidOrExpired type={error} />;
	}
}

const InvalidOrExpired = ({ type }: { type: "invalid_token" | "expired_token" }) => {
	const [isPending, startTransition] = useTransition();
	const { data } = authClient.useSession();
	if (!data) return;

	const title =
		type === "expired_token" ? "Your verification link has expired" : "Invalid verification link";

	const description =
		type === "expired_token"
			? "The verification link has expired. You can request a new one below."
			: "The verification link is invalid or has already been used.";

	return (
		<main className="min-h-screen flex items-center justify-center bg-white px-6">
			<div className="w-full max-w-md text-center">
				<h1 className="text-2xl font-semibold text-red-600">{title}</h1>
				<p className="text-foreground/70 mt-3">{description}</p>

				<div className="mt-8">
					<button
						className="inline-block w-full py-3 rounded-md bg-foreground text-white font-medium"
						onClick={() => {
							startTransition(async () => {
								await authClient.sendVerificationEmail(
									{ email: data?.user.email },
									{
										onSuccess: (ctx) => {
											console.log("Verification sent", ctx);
										},
										onError: (ctx) => {
											console.log("Error sending", ctx.error.message);
										},
									},
								);
							});
						}}
					>
						{isPending ? "Sending..." : "Resend verification email"}
					</button>
				</div>

				<p className="text-sm text-foreground/40 mt-4">If the issue continues, contact support.</p>
			</div>
		</main>
	);
};

const NoSession = () => {
	return (
		<main className="min-h-screen flex items-center justify-center bg-white px-6">
			<div className="max-w-md text-center">
				<h1 className="text-2xl font-semibold text-yellow-600">You are not signed in</h1>

				<p className="text-foreground/70 mt-3">
					We could not verify your email because you are not logged in. Please sign in and try
					again.
				</p>

				<Link
					href="/sign-in"
					className="inline-block mt-6 py-3 px-6 rounded-md bg-foreground text-white font-medium"
				>
					Sign in
				</Link>
			</div>
		</main>
	);
};

const Valid = () => {
	return (
		<main className="min-h-screen flex items-center justify-center bg-white px-6">
			<div className="max-w-md text-center">
				<h1 className="text-2xl font-semibold text-green-600">Email verified</h1>
				<p className="text-foreground/70 mt-3">
					Your email has been successfully verified. You can now continue.
				</p>

				<Link
					href="/"
					className="mt-6 inline-block py-3 px-6 rounded-md bg-foreground text-white font-medium"
				>
					Continue
				</Link>
			</div>
		</main>
	);
};
