"use client";

import { Button } from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Password from "@/components/ui/password";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function LoginClient() {
	const router = useRouter();
	return (
		<form
			aria-describedby="login-note"
			onSubmit={(e) => {
				e.preventDefault();
				router.push("/uploads");
			}}
			className="text-gray-800 mt-12"
		>
			<div className="mb-4">
				<Label htmlFor="email" className="mb-1">
					Email Address
				</Label>
				<Input id="email" className="h-11" placeholder="eg., john.doe@stmaryhospital.org" />
			</div>
			<Password id="password" label="Password" />
			<div className="flex items-center justify-between mb-4">
				<Checkbox id="rememberMe">Remember me</Checkbox>
				<Link href="/forgot-password" className="font-medium text-[14px]">
					Forgot Password
				</Link>
			</div>

			<p id="login-note" className="text-[14px]">
				Use your verified hospital credentials. Access is monitored for compliance and security.
			</p>
			<Button className="w-full h-11 mt-12" type="submit">
				Log in
			</Button>
			<p className="text-center mt-4">
				<span>Need an account? </span>
				<Link href="/info" className="font-medium">
					Register
				</Link>
			</p>
		</form>
	);
}
