"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/better-auth/auth.client";
import { Button } from "@/components/ui/button";

export function EmailVerifiedClient() {
	const searchParams = useSearchParams();
	const [resendMessage, setResendMessage] = useState("");
	const error = searchParams.get("error");
	if (!error) return <Valid />;

	if (error === "no_session") return <NoSession />;
	if (error === "unverified") return <Unverified />;

	if (error === "invalid_token" || error === "expired_token") {
		return <InvalidOrExpired type={error} />;
	}
}

function Unverified() {
	return (
		<main className="max-w-[37.5rem] min-h-dvh grid place-items-center mx-auto bg-white px-6 md:px-0 my-10">
			<div className="w-full text-center">
				<h1 className="text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-yellow-600">
					Email verification required
				</h1>
				<p className="text-gray-600 text-sm font-medium text-balance mt-4">
					Verify your email before continuing. Check your inbox for the verification link. If it is
					missing or expired, contact support.
				</p>
				<Button className="mt-6">
					<Link href="/sign-in">Sign in</Link>
				</Button>
			</div>
		</main>
	);
}

function InvalidOrExpired({ type }: { type: "invalid_token" | "expired_token" }) {
	const [isPending, startTransition] = useTransition();
	const { data, isPending: isCheckingSession } = authClient.useSession();

	const title =
		type === "expired_token" ? "Your verification link has expired" : "Invalid verification link";

	const description =
		type === "expired_token"
			? "The verification link has expired. You can request a new one below."
			: "The verification link is invalid or has already been used.";

	if (isCheckingSession) {
		return (
			<main className="max-w-[37.5rem] min-h-dvh grid place-items-center mx-auto px-6 md:px-0 my-10">
				<div className="w-full text-center">
					<p className="text-gray-600 text-sm font-medium">Checking verification status...</p>
				</div>
			</main>
		);
	}

	return (
		<main className="max-w-[37.5rem] min-h-dvh grid place-items-center mx-auto bg-white px-6 md:px-0 my-10">
			<div className="w-full text-center">
				<h1 className="text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-red-600">
					{title}
				</h1>
				<p className="text-gray-600 text-sm font-medium text-balance mt-4">{description}</p>

				<div className="mt-8">
					<button
						className="inline-block w-full py-3 rounded-md bg-foreground text-white font-medium"
						onClick={() => {
							startTransition(async () => {
								setResendMessage("");
								await authClient.sendVerificationEmail(
									{ email: data?.user.email ?? "" },
									{
										onSuccess: () => setResendMessage("Verification email sent."),
										onError: (ctx) => setResendMessage(ctx.error.message),
									},
								);
							});
						}}
					>
						{isPending ? "Sending..." : "Resend verification email"}
					</button>
					{resendMessage && (
						<p className="mt-3 text-sm text-gray-600" role="status">
							{resendMessage}
						</p>
					)}
				</div>

				<p className="text-xs text-gray-500 mt-4">If the issue continues, contact support.</p>
			</div>
		</main>
	);
}

function NoSession() {
	return (
		<main className="max-w-[37.5rem] min-h-dvh grid place-items-center mx-auto bg-white px-6 md:px-0 my-10">
			<div className="w-full text-center">
				<h1 className="text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-yellow-600">
					You are not signed in
				</h1>

				<p className="text-gray-600 text-sm font-medium text-balance mt-4">
					We could not verify your email because you are not logged in. Please sign in and try
					again.
				</p>

				<Button className="mt-6">
					<Link href="/sign-in">Sign in</Link>
				</Button>
			</div>
		</main>
	);
}

const Valid = () => {
	return (
		<main className="max-w-[37.5rem] min-h-dvh grid place-items-center mx-auto bg-white px-6 md:px-0 my-10">
			<div className="w-full text-center">
				<h1 className="text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-green-600">
					Email verified
				</h1>
				<p className="text-gray-600 text-sm font-medium text-balance mt-4">
					Your email has been successfully verified. You can now continue.
				</p>
				<Button className="mt-6">
					<Link href="/">Continue</Link>
				</Button>
			</div>
		</main>
	);
};
