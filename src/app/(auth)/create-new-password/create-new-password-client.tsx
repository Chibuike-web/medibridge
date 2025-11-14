"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EyeLine from "@/icons/eye-line";
import EyeOffLine from "@/icons/eye-off-line";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function CreateNewPasswordClient() {
	const router = useRouter();
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

	return (
		<form
			aria-describedby="login-note"
			onSubmit={(e) => {
				e.preventDefault();
				router.push("/create-new-password/verify");
			}}
			className="text-gray-800 mt-12"
		>
			<div className="mb-4">
				<Label htmlFor="newPassword" className="block mb-2">
					New Password
				</Label>
				<div className="relative">
					<Input
						id="newPassword"
						type={isPasswordVisible ? "text" : "password"}
						placeholder="Enter new password"
						className="h-11"
					/>
					<button
						type="button"
						aria-label={isPasswordVisible ? "Hide password" : "Show password"}
						className="absolute right-4 top-1/2 -translate-y-1/2"
						onClick={() => setIsPasswordVisible(!isPasswordVisible)}
					>
						{isPasswordVisible ? (
							<EyeOffLine className="size-[20px] text-gray-600" />
						) : (
							<EyeLine className="size-[20px] text-gray-600" />
						)}
					</button>
				</div>
			</div>
			<div className="mb-4">
				<Label htmlFor="confirmNewPassword" className="block mb-2">
					Confirm New Password
				</Label>
				<div className="relative">
					<Input
						id="confirmNewPassword"
						type={isConfirmPasswordVisible ? "text" : "password"}
						placeholder="Confirm New password"
						className="h-11"
					/>
					<button
						type="button"
						aria-label={isConfirmPasswordVisible ? "Hide password" : "Show password"}
						className="absolute right-4 top-1/2 -translate-y-1/2"
						onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
					>
						{isConfirmPasswordVisible ? (
							<EyeOffLine className="size-[20px] text-gray-600" />
						) : (
							<EyeLine className="size-[20px] text-gray-600" />
						)}
					</button>
				</div>
			</div>
			<Button className="w-full h-11 mt-12" type="submit">
				Reset Password
			</Button>
		</form>
	);
}
