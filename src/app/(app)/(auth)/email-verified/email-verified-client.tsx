"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/better-auth/auth.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiCheckboxCircleFill, RiErrorWarningFill } from "@remixicon/react";

export function EmailVerifiedClient() {
	const searchParams = useSearchParams();
	const error = searchParams.get("error");
	if (!error) return <Valid />;

	if (error === "no_session") return <NoSession />;
	if (error === "unverified") return <Unverified />;

	// Better Auth's verify-email route appends TOKEN_EXPIRED, INVALID_TOKEN, or another
	// error code to the callback URL when a verification link fails.
	return <InvalidOrExpired type={error === "TOKEN_EXPIRED" ? "TOKEN_EXPIRED" : "INVALID_TOKEN"} />;
}

function Unverified() {
	return (
		<main className="h-dvh overflow-y-auto bg-white">
			<div className="max-w-[31.25rem] min-h-full grid place-items-center mx-auto px-6 md:px-0 py-10">
				<div className="w-full text-center">
					<h1 className="text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-yellow-600 text-balance">
						Email verification required
					</h1>
					<p className="text-gray-600 text-sm font-medium text-pretty mt-4">
						Verify your email before continuing. Check your inbox for the verification link. If it
						is missing or expired, contact support.
					</p>
					<Button asChild className="mt-6">
						<Link href="/sign-in">Sign in</Link>
					</Button>
				</div>
			</div>
		</main>
	);
}

type ResendFeedback = {
	type: "error" | "success";
	message: string;
};

function InvalidOrExpired({ type }: { type: "INVALID_TOKEN" | "TOKEN_EXPIRED" }) {
	const [resendFeedback, setResendFeedback] = useState<ResendFeedback | null>(null);
	const [isPending, startTransition] = useTransition();

	const title =
		type === "TOKEN_EXPIRED" ? "Your verification link has expired" : "Invalid verification link";

	const description =
		type === "TOKEN_EXPIRED"
			? "The verification link has expired. Enter your email to get a new one."
			: "The verification link is invalid. Enter your email to get a new one.";

	return (
		<main className="h-dvh overflow-y-auto bg-white">
			<div className="max-w-[31.25rem] min-h-full grid place-items-center mx-auto px-6 md:px-0 py-10">
				<div className="w-full">
					<div className="text-center">
						<h1 className="text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-red-600 text-balance">
							{title}
						</h1>
						<p className="text-gray-600 text-sm font-medium text-pretty mt-4">{description}</p>
					</div>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							setResendFeedback(null);

							const formData = new FormData(e.currentTarget);
							const email = String(formData.get("email") ?? "").trim();

							startTransition(async () => {
								try {
									const { error } = await authClient.sendVerificationEmail({
										email,
										callbackURL: "/email-verified",
									});

									if (error?.status === 429) {
										setResendFeedback({
											type: "error",
											message: "Too many attempts. Wait a moment and try again.",
										});
										return;
									}

									if (error) {
										setResendFeedback({
											type: "error",
											message: "We couldn’t send a new link. Please try again.",
										});
										return;
									}

									setResendFeedback({
										type: "success",
										message:
											"If that email belongs to an unverified account, we sent a new verification link.",
									});
								} catch {
									setResendFeedback({
										type: "error",
										message: "We couldn’t send a new link. Please try again.",
									});
								}
							});
						}}
						aria-busy={isPending}
						className="text-gray-800 mt-8"
					>
						<Label htmlFor="email" className="block mb-2 text-sm">
							Email Address
						</Label>
						<Input
							id="email"
							name="email"
							type="email"
							autoComplete="email"
							required
							placeholder="sarah.thompson@stmaryhospital.org"
							aria-describedby={resendFeedback ? "resend-feedback" : undefined}
							onChange={() => setResendFeedback(null)}
						/>
						{resendFeedback?.type === "error" && (
							<div
								id="resend-feedback"
								role="alert"
								className="mt-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
							>
								<RiErrorWarningFill className="size-4 shrink-0" aria-hidden="true" />
								<span>{resendFeedback.message}</span>
							</div>
						)}
						{resendFeedback?.type === "success" && (
							<div
								id="resend-feedback"
								role="status"
								className="mt-4 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700"
							>
								<RiCheckboxCircleFill className="size-4 shrink-0" aria-hidden="true" />
								<span>{resendFeedback.message}</span>
							</div>
						)}
						<Button className="mt-6 w-full" type="submit" disabled={isPending}>
							{isPending ? "Sending…" : "Resend verification email"}
						</Button>
					</form>

					<p className="text-xs text-gray-500 text-center mt-4">
						If the issue continues, contact support.
					</p>
				</div>
			</div>
		</main>
	);
}

function NoSession() {
	return (
		<main className="h-dvh overflow-y-auto bg-white">
			<div className="max-w-[31.25rem] min-h-full grid place-items-center mx-auto px-6 md:px-0 py-10">
				<div className="w-full text-center">
					<h1 className="text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-yellow-600 text-balance">
						You are not signed in
					</h1>

					<p className="text-gray-600 text-sm font-medium text-pretty mt-4">
						Sign in to continue. If you haven’t verified your email yet, use the link in your inbox.
					</p>

					<Button asChild className="mt-6">
						<Link href="/sign-in">Sign in</Link>
					</Button>
				</div>
			</div>
		</main>
	);
}

const Valid = () => {
	return (
		<main className="h-dvh overflow-y-auto bg-white">
			<div className="max-w-[31.25rem] min-h-full grid place-items-center mx-auto px-6 md:px-0 py-10">
				<div className="w-full text-center">
					<h1 className="text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-green-600 text-balance">
						Email verified
					</h1>
					<p className="text-gray-600 text-sm font-medium text-pretty mt-4">
						Your email has been successfully verified. You can now continue.
					</p>
					<Button asChild className="mt-6">
						<Link href="/hospital-details">Continue</Link>
					</Button>
				</div>
			</div>
		</main>
	);
};
