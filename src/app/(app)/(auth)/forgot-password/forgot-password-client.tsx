"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiInformationLine } from "@remixicon/react";
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
					<span className="text-sm text-gray-400">Must be official verified hospital email</span>
				</p>
				{requestFeedback && (
					<p id="reset-feedback" role="status" className="mt-3 text-sm text-amber-700">
						{requestFeedback}
					</p>
				)}
			</div>
			<Button className="mt-16 w-full" type="submit" disabled={isPending}>
				{isPending ? "Sending…" : "Send Reset Link"}
			</Button>
		</form>
	);
}
