"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
			<div className="mb-4">
				<Label htmlFor="email" className="block mb-3">
					Email Address
				</Label>
				<Input id="email" placeholder="eg., john.doe@stmaryhospital.org" />
			</div>
			<Button className="mt-16 w-full text-sm" type="submit">
				Send Reset Link
			</Button>
		</form>
	);
}
