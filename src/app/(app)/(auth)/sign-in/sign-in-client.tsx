"use client";

import { signInAction } from "@/features/auth/server/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema, SignInType } from "@/features/auth/schemas/sign-in-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import {
	RiCheckboxCircleFill,
	RiErrorWarningFill,
	RiEyeLine,
	RiEyeOffLine,
	RiInformationLine,
} from "@remixicon/react";

export function SignInClient() {
	const router = useRouter();
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [signInError, setSignInError] = useState("");
	const [signInSuccess, setSignInSuccess] = useState("");
	const [isRedirectPending, startRedirectTransition] = useTransition();

	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm<SignInType>({
		resolver: zodResolver(signInSchema),
	});

	const onSubmit = async (data: SignInType) => {
		setSignInError("");
		setSignInSuccess("");
		try {
			const response = await signInAction(data);
			if (response.status === "failed") {
				console.error(response.error);
				setSignInError(response.error || "");
				return;
			}
		} catch (signInActionError) {
			setSignInError(signInActionError instanceof Error ? signInActionError.message : "Unknown error");
			return;
		}
		startRedirectTransition(() => {
			router.replace("/dashboard/overview");
		});
	};

	return (
		<form
			aria-describedby="sign-in-note"
			onSubmit={handleSubmit(onSubmit)}
			className="text-gray-800 mt-12"
		>
			<div className="mb-8">
				<Label htmlFor="adminEmail" className="block mb-3.5">
					Email Address
				</Label>
				<Input
					id="adminEmail"
					type="email"
					placeholder="sarah.thompson@stmaryhospital.org"
					className="h-9"
					{...register("email")}
					aria-invalid={!!errors.email}
					aria-describedby={errors.email ? "email-error" : "email-info"}
				/>
				{errors.email && (
					<p id="email-error" className="font-medium text-red-500 mt-2 text-sm">
						{errors.email.message}
					</p>
				)}
				{!errors.email && (
					<p id="email-info" className="flex gap-1 items-center mt-3.5">
						<RiInformationLine className="text-gray-400 size-4" aria-hidden="true" />
						<span className="text-sm text-gray-400">Must be official verified hospital email</span>
					</p>
				)}
			</div>
			<div className="mb-2">
				<Label htmlFor="password" className="block mb-3.5">
					Password
				</Label>
				<div className="relative">
					<Input
						id="password"
						type={isPasswordVisible ? "text" : "password"}
						placeholder="Enter new password"
						className="h-9"
						{...register("password")}
						aria-describedby={errors.password ? "admin-password-error" : undefined}
						aria-invalid={!!errors.password}
					/>
					<button
						type="button"
						aria-label={isPasswordVisible ? "Hide password" : "Show password"}
						className="absolute right-4 top-1/2 -translate-y-1/2"
						onClick={() => setIsPasswordVisible(!isPasswordVisible)}
					>
						<span aria-hidden="true">
							{isPasswordVisible ? (
								<RiEyeOffLine className="size-5 text-gray-600" />
							) : (
								<RiEyeLine className="size-5 text-gray-600" />
							)}
						</span>
					</button>
				</div>
				{errors.password && (
					<p id="admin-password-error" className="font-medium text-red-500 mt-1 text-sm">
						{errors.password.message}
					</p>
				)}
			</div>
			<div className="flex items-center justify-between mb-4 text-sm">
				<Controller
					name="rememberMe"
					control={control}
					defaultValue={false}
					render={({ field }) => (
						<Label className="flex items-center gap-2 cursor-pointer">
							<Checkbox checked={field.value} onCheckedChange={field.onChange} />
							Remember me
						</Label>
					)}
				/>

				<Link href="/forgot-password" className="font-medium text-sm">
					Forgot Password
				</Link>
			</div>

			<p id="sign-in-note" className="text-sm">
				Use your verified hospital credentials. Access is monitored for compliance and security.
			</p>

			{signInError && (
				<div className="mt-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
					<span className="shrink-0">
						<RiErrorWarningFill className="size-4" aria-hidden="true" />
					</span>
					<span>{signInError}</span>
				</div>
			)}

			{signInSuccess && (
				<div className="flex items-center gap-2 px-4 py-4 mt-4 bg-green-100 text-green-700 text-sm font-medium rounded-md border border-green-200">
					<span>
						<RiCheckboxCircleFill className="size-5" />
					</span>
					<span>{signInSuccess}</span>
				</div>
			)}
			<Button className="w-full h-9 mt-16" type="submit" disabled={isSubmitting || isRedirectPending}>
				{isSubmitting ? (
					<span className="flex items-center gap-2">
						<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
						Signing in...
					</span>
				) : (
					"Sign in"
				)}
			</Button>
		</form>
	);
}
