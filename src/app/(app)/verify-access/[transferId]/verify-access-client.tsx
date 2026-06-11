"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Link from "next/link";

type VerifyAccessClientProps = {
	recipientEmail: string;
};

export function VerifyAccessClient({ recipientEmail }: VerifyAccessClientProps) {
	const [code, setCode] = useState("");

	return (
		<section className="flex w-full max-w-[500px] flex-col items-center text-center">
			<h1 className="text-2xl font-semibold leading-[1.2] text-gray-800">Verify Access</h1>
			<p className="mt-4 text-base leading-6 text-gray-600">
				Enter the verification code sent to {recipientEmail} to access the shared patient record.
			</p>

			<InputOTP
				maxLength={6}
				value={code}
				onChange={setCode}
				containerClassName="mt-6 justify-center"
			>
				<InputOTPGroup className="gap-6">
					{Array.from({ length: 6 }).map((_, index) => (
						<InputOTPSlot
							key={index}
							index={index}
							className="size-12 rounded-md border border-gray-300 bg-white text-base font-medium text-gray-800 first:rounded-md first:border last:rounded-md"
						/>
					))}
				</InputOTPGroup>
			</InputOTP>

			<Button type="button" className="mt-16 h-auto px-6 py-3">
				<Link href="#">Continue</Link>
			</Button>
		</section>
	);
}
