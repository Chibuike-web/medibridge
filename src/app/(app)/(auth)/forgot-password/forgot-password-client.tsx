"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiErrorWarningFill, RiInformationLine } from "@remixicon/react";
import { authClient } from "@/lib/better-auth/auth.client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ForgotPasswordClient() {
	const router = useRouter();
	const [requestFeedback, setRequestFeedback] = useState("");
	const [isPending, startTransition] = useTransition();

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				setRequestFeedback("");

				const formData = new FormData(e.currentTarget);
				const email = String(formData.get("email") ?? "").trim();

				startTransition(async () => {
					try {
						const { error } = await authClient.requestPasswordReset({
							email,
							redirectTo: new URL("/create-new-password", window.location.origin).toString(),
						});

						if (error) {
							setRequestFeedback("We couldn’t process that request. Please try again.");
							return;
						}

						router.push("/forgot-password/verify");
					} catch {
						setRequestFeedback("We couldn’t process that request. Please try again.");
					}
				});
			}}
			aria-busy={isPending}
			className="text-gray-800 mt-12"
		>
			<div className="mb-6">
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
					aria-describedby={requestFeedback ? "email-info reset-feedback" : "email-info"}
					onChange={() => setRequestFeedback("")}
				/>
				<p id="email-info" className="flex gap-1 items-center mt-2">
					<RiInformationLine className="text-gray-400 size-4" aria-hidden="true" />
					<span className="text-sm text-gray-400">Use the email you sign in with</span>
				</p>
				{requestFeedback && (
					<div
						id="reset-feedback"
						role="alert"
						className="mt-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
					>
						<RiErrorWarningFill className="size-4 shrink-0" aria-hidden="true" />
						<span>{requestFeedback}</span>
					</div>
				)}
			</div>
			<Button className="mt-16 w-full" type="submit" disabled={isPending}>
				{isPending ? "Sending…" : "Send Reset Link"}
			</Button>
		</form>
	);
}
