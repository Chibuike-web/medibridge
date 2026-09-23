"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiInformationLine } from "@remixicon/react";
import { useState } from "react";

export function ForgotPasswordClient() {
	const [requestFeedback, setRequestFeedback] = useState("");

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				setRequestFeedback("Password reset email isn’t connected yet. No email was sent.");
			}}
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
			<Button className="mt-16 w-full" type="submit">
				Send Reset Link
			</Button>
		</form>
	);
}
