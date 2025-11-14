"use client";

import { Button } from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EyeLine from "@/icons/eye-line";
import EyeOffLine from "@/icons/eye-off-line";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInClient() {
	const router = useRouter();
	const [isVisible, setIsVisible] = useState(false);

	return (
		<form
			aria-describedby="sign-in-note"
			onSubmit={(e) => {
				e.preventDefault();
				router.push("/uploads");
			}}
			className="text-gray-800 mt-12"
		>
			<div className="mb-4">
				<Label htmlFor="email" className="block mb-2">
					Email Address
				</Label>
				<Input id="email" className="h-11" placeholder="eg., john.doe@stmaryhospital.org" />
			</div>
			<div className="mb-4">
				<Label htmlFor="password" className="block mb-2">
					Password
				</Label>
				<div className="relative">
					<Input
						id="password"
						type={isVisible ? "text" : "password"}
						placeholder="Enter new password"
						className="h-11"
					/>
					<button
						type="button"
						aria-label={isVisible ? "Hide password" : "Show password"}
						className="absolute right-4 top-1/2 -translate-y-1/2"
						onClick={() => setIsVisible(!isVisible)}
					>
						{isVisible ? (
							<EyeOffLine className="size-[20px] text-gray-600" />
						) : (
							<EyeLine className="size-[20px] text-gray-600" />
						)}
					</button>
				</div>
			</div>
			<div className="flex items-center justify-between mb-4">
				<Checkbox id="rememberMe">Remember me</Checkbox>
				<Link href="/forgot-password" className="font-medium text-[14px]">
					Forgot Password
				</Link>
			</div>

			<p id="sign-in-note" className="text-[14px]">
				Use your verified hospital credentials. Access is monitored for compliance and security.
			</p>
			<Button className="w-full h-11 mt-12" type="submit">
				Log in
			</Button>
		</form>
	);
}
