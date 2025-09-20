"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
	const router = useRouter();
	return (
		<div className="px-6 xl:px-0">
			<div className="max-w-[800px] mx-auto py-8">
				<Link href="/uploads" className="flex gap-2 w-max">
					<ArrowLeft /> <span>Back</span>
				</Link>
			</div>
			<div className="max-w-[550px] mx-auto">
				<div className="mb-12">
					<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] mt-10">
						Forgot Your Password?
					</h1>
					<p className="text-center mt-5 text-gray-600 font-medium">
						We’ll send a link to reset your password.
					</p>
				</div>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						router.push("/forgot-password/verify");
					}}
					className="text-gray-800 mt-12"
				>
					<div className="mb-4">
						<Label htmlFor="email" className="mb-1">
							Email Address
						</Label>
						<Input id="email" className="h-11" placeholder="eg., john.doe@stmaryhospital.org" />
					</div>
					<Button className="w-full h-11 mt-12" type="submit">
						Send Reset Link
					</Button>
				</form>
			</div>
		</div>
	);
}
