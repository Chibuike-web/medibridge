"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiInformationLine } from "@remixicon/react";
import { useRouter } from "next/navigation";

export function ForgotPasswordClient() {
	const router = useRouter();

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				router.push("/forgot-password/verify");
			}}
			className="text-gray-800 mt-12"
			>
				<div className="mb-6">
					<Label htmlFor="email" className="block mb-2 text-sm">
						Email Address
					</Label>
					<Input
						id="email"
						placeholder="sarah.thompson@stmaryhospital.org"
						aria-describedby="email-info"
					/>
					<p id="email-info" className="flex gap-1 items-center mt-2">
						<RiInformationLine className="text-gray-400 size-4" aria-hidden="true" />
						<span className="text-sm text-gray-400">Must be official verified hospital email</span>
					</p>
				</div>
			<Button className="mt-16 w-full text-sm" type="submit">
				Send Reset Link
			</Button>
		</form>
	);
}
