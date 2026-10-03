"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { ownerSchema, OwnerType } from "@/features/auth/schemas/owner-schema";
import { RiEyeLine, RiEyeOffLine, RiInformationLine } from "@remixicon/react";
import { authClient } from "@/lib/better-auth/auth.client";

export function OwnerClient() {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [error, setError] = useState("");
	const [emailSent, setEmailSent] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(ownerSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
	});

	async function onSubmit(data: OwnerType) {
		setError("");
		try {
			const { error } = await authClient.signUp.email({
				name: data.name,
				email: data.email,
				password: data.password,
				callbackURL: "/hospital-details",
			});

			if (error?.status === 429) {
				setError("Too many attempts. Wait a moment and try again.");
				return;
			}

			if (error) {
				setError(error.message ?? "Account creation failed");
				return;
			}

			setEmailSent(true);
		} catch {
			setError("Account creation failed");
		}
	}

	if (emailSent) {
		return (
			<div className="text-center" role="status">
				<h2 className="text-lg font-semibold">Check your email</h2>
				<p className="mt-3 text-sm text-gray-600">
					We sent a verification link. After verifying your email, you can add your hospital
					details.
				</p>
			</div>
		);
	}
	return (
		<form onSubmit={handleSubmit(onSubmit)} className="text-gray-800 w-full">
			<div className="mb-6">
				<Label htmlFor="name" className="block mb-2 text-sm">
					Name
				</Label>
				<Input
					id="name"
					type="text"
					placeholder="eg., John Doe"
					{...register("name")}
					aria-describedby={errors.name ? "name-error" : undefined}
					aria-invalid={!!errors.name}
				/>
				{errors.name && (
					<p id="name-error" className="font-medium text-red-500 mt-2 text-sm">
						{errors.name.message}
					</p>
				)}
			</div>
			<div className="mb-6">
				<Label htmlFor="email" className="block mb-2 text-sm">
					Email
				</Label>
				<Input
					id="email"
					placeholder="sarah.thompson@stmaryhospital.org"
					type="email"
					{...register("email")}
					aria-describedby={errors.email ? "email-error" : "email-info"}
					aria-invalid={!!errors.email}
				/>
				{errors.email ? (
					<p id="email-error" className="font-medium text-red-500 mt-2 text-sm">
						{errors.email.message}
					</p>
				) : (
					<p id="email-info" className="flex gap-1 items-center mt-2">
						<RiInformationLine className="text-gray-400 size-4" aria-hidden="true" />
						<span className="text-sm text-gray-400">Must be official verified hospital email</span>
					</p>
				)}
			</div>

			<Label htmlFor="password" className="block mb-2 text-sm">
				Password
			</Label>
			<div className="relative">
				<Input
					id="password"
					type={isPasswordVisible ? "text" : "password"}
					placeholder="Enter a secure password"
					{...register("password")}
					aria-describedby={errors.password ? "password-error" : undefined}
					aria-invalid={!!errors.password}
				/>
				<Button
					variant="ghost"
					size="icon"
					type="button"
					aria-pressed={isPasswordVisible}
					aria-label={isPasswordVisible ? "Hide password" : "Show password"}
					className="absolute right-4 top-1/2 -translate-y-1/2 size-auto rounded-none border-0 hover:bg-transparent focus-visible:border-0"
					onClick={() => setIsPasswordVisible(!isPasswordVisible)}
				>
					<span aria-hidden="true">
						{isPasswordVisible ? (
							<RiEyeOffLine className="size-4 text-gray-600" />
						) : (
							<RiEyeLine className="size-4 text-gray-600" />
						)}
					</span>
				</Button>
			</div>
			{errors.password && (
				<p id="password-error" className="font-medium text-red-500 mt-2 text-sm">
					{errors.password.message}
				</p>
			)}

			{error && (
				<p className="mt-4 text-sm font-medium text-red-600" role="alert">
					{error}
				</p>
			)}
			<Button className="w-full mt-16" type="submit" disabled={isSubmitting}>
				{isSubmitting ? "Creating account..." : "Continue"}
			</Button>
		</form>
	);
}
