"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";

export function CreateNewPasswordClient() {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [confirmedPassword, setConfirmedPassword] = useState("");
	const [passwordFeedback, setPasswordFeedback] = useState("");
	const [isPasswordMismatch, setIsPasswordMismatch] = useState(false);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (newPassword !== confirmedPassword) {
					setIsPasswordMismatch(true);
					setPasswordFeedback("");
					return;
				}

				setIsPasswordMismatch(false);
				setPasswordFeedback("Password reset isn’t connected yet. Your password was not changed.");
			}}
			className="text-gray-800 mt-12"
		>
			<div className="mb-6">
				<Label htmlFor="newPassword" className="block mb-2 text-sm">
					New Password
				</Label>
				<div className="relative">
					<Input
						id="newPassword"
						name="newPassword"
						type={isPasswordVisible ? "text" : "password"}
						autoComplete="new-password"
						minLength={8}
						required
						value={newPassword}
						aria-describedby="password-requirement"
						placeholder="Enter new password"
						onChange={(event) => {
							setNewPassword(event.target.value);
							setPasswordFeedback("");
							setIsPasswordMismatch(false);
						}}
					/>
					<button
						type="button"
						aria-label={isPasswordVisible ? "Hide password" : "Show password"}
						aria-pressed={isPasswordVisible}
						className="absolute right-4 top-1/2 -translate-y-1/2"
						onClick={() => setIsPasswordVisible(!isPasswordVisible)}
					>
						{isPasswordVisible ? (
							<RiEyeOffLine className="size-4 text-gray-600" aria-hidden="true" />
						) : (
							<RiEyeLine className="size-4 text-gray-600" aria-hidden="true" />
						)}
					</button>
				</div>
				<p id="password-requirement" className="mt-2 text-sm text-gray-400">
					Use at least 8 characters.
				</p>
			</div>
			<div className="mb-6">
				<Label htmlFor="confirmNewPassword" className="block mb-2 text-sm">
					Confirm New Password
				</Label>
				<div className="relative">
					<Input
						id="confirmNewPassword"
						name="confirmNewPassword"
						type={isConfirmPasswordVisible ? "text" : "password"}
						autoComplete="new-password"
						required
						value={confirmedPassword}
						aria-invalid={isPasswordMismatch}
						aria-describedby={isPasswordMismatch ? "password-mismatch" : undefined}
						placeholder="Confirm new password"
						onChange={(event) => {
							setConfirmedPassword(event.target.value);
							setPasswordFeedback("");
							setIsPasswordMismatch(false);
						}}
					/>
					<button
						type="button"
						aria-label={
							isConfirmPasswordVisible ? "Hide confirmation password" : "Show confirmation password"
						}
						aria-pressed={isConfirmPasswordVisible}
						className="absolute right-4 top-1/2 -translate-y-1/2"
						onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
					>
						{isConfirmPasswordVisible ? (
							<RiEyeOffLine className="size-4 text-gray-600" aria-hidden="true" />
						) : (
							<RiEyeLine className="size-4 text-gray-600" aria-hidden="true" />
						)}
					</button>
				</div>
				{isPasswordMismatch && (
					<p id="password-mismatch" className="mt-2 text-sm text-red-600">
						Passwords do not match.
					</p>
				)}
			</div>
			{passwordFeedback && (
				<p role="status" className="mb-4 text-sm text-amber-700">
					{passwordFeedback}
				</p>
			)}
			<Button className="mt-16 w-full" type="submit">
				Reset Password
			</Button>
		</form>
	);
}
