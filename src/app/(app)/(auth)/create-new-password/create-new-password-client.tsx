"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";

export function CreateNewPasswordClient() {
	const router = useRouter();
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

	return (
		<form
			aria-describedby="login-note"
			onSubmit={(e) => {
				e.preventDefault();
				router.push("/create-new-password/success");
			}}
			className="text-gray-800 mt-12"
		>
			<div className="mb-8">
				<Label htmlFor="newPassword" className="block mb-3.5">
					New Password
				</Label>
				<div className="relative">
					<Input
						id="newPassword"
						type={isPasswordVisible ? "text" : "password"}
						placeholder="Enter new password"
						className="h-9"
					/>
					<button
						type="button"
						aria-label={isPasswordVisible ? "Hide password" : "Show password"}
						className="absolute right-4 top-1/2 -translate-y-1/2"
						onClick={() => setIsPasswordVisible(!isPasswordVisible)}
					>
						{isPasswordVisible ? (
							<RiEyeOffLine className="size-5 text-gray-600" />
						) : (
							<RiEyeLine className="size-5 text-gray-600" />
						)}
					</button>
				</div>
			</div>
			<div className="mb-8">
				<Label htmlFor="confirmNewPassword" className="block mb-3.5">
					Confirm New Password
				</Label>
				<div className="relative">
					<Input
						id="confirmNewPassword"
						type={isConfirmPasswordVisible ? "text" : "password"}
						placeholder="Confirm New password"
						className="h-9"
					/>
					<button
						type="button"
						aria-label={isConfirmPasswordVisible ? "Hide password" : "Show password"}
						className="absolute right-4 top-1/2 -translate-y-1/2"
						onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
					>
						{isConfirmPasswordVisible ? (
							<RiEyeOffLine className="size-5 text-gray-600" />
						) : (
							<RiEyeLine className="size-5 text-gray-600" />
						)}
					</button>
				</div>
			</div>
			<Button className="w-full h-9 mt-16" type="submit">
				Reset Password
			</Button>
		</form>
	);
}
