"use client";

import { signInAction } from "@/actions/sign-in-action";
import { Button } from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ErrorWarningFill from "@/icons/error-warning-fill";
import EyeLine from "@/icons/eye-line";
import EyeOffLine from "@/icons/eye-off-line";
import InformationLine from "@/icons/information-line";
import {
	hospitalAdminSignInSchema,
	HospitalAdminSignInType,
} from "@/lib/schemas/hospital-admin-sign-in-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function SignInClient() {
	const router = useRouter();
	const [isVisible, setIsVisible] = useState(false);
	const [error, setError] = useState("");

	const {
		register,
		reset,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(hospitalAdminSignInSchema),
	});

	const onSubmit = async (data: HospitalAdminSignInType) => {
		setError("");
		try {
			const response = await signInAction(data);
			if (response.status === "failed") {
				console.error(response.error);
				setError(response.error || "");
				return;
			} else if (response.status === "success") {
				router.replace("/");

				setTimeout(() => {
					reset();
				}, 1000);
			}
		} catch (error) {
			setError(error instanceof Error ? error.message : "Unknown error");
		}
	};

	return (
		<form
			aria-describedby="sign-in-note"
			onSubmit={handleSubmit(onSubmit)}
			className="text-gray-800 mt-12"
		>
			<div className="mb-4">
				<Label htmlFor="adminEmail" className="block mb-2">
					Admin Email Address
				</Label>
				<Input
					id="adminEmail"
					type="text"
					placeholder="sarah.thompson@stmaryhospital.org"
					className="h-11"
					{...register("adminEmail")}
					aria-invalid={!!errors.adminEmail}
					aria-describedby={errors.adminEmail ? "admin-error-error" : "admin-email-info"}
				/>
				{errors.adminEmail && (
					<p id="admin-email-error" className="font-medium text-red-500 mt-1 text-[14px]">
						{errors.adminEmail.message}
					</p>
				)}
				{!errors.adminEmail && (
					<p id="admin-email-info" className="flex gap-1 items-center mt-2">
						<InformationLine className="text-gray-400 size-4" aria-hidden="true" />
						<span className="text-[14px] text-gray-400">
							Must be official verified hospital email
						</span>
					</p>
				)}
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
						{...register("adminPassword")}
						aria-describedby={errors.adminPassword ? "admin-password-error" : undefined}
						aria-invalid={!!errors.adminPassword}
					/>
					<button
						type="button"
						aria-label={isVisible ? "Hide password" : "Show password"}
						className="absolute right-4 top-1/2 -translate-y-1/2"
						onClick={() => setIsVisible(!isVisible)}
					>
						<span aria-hidden="true">
							{isVisible ? (
								<EyeOffLine className="size-5 text-gray-600" />
							) : (
								<EyeLine className="size-5 text-gray-600" />
							)}
						</span>
					</button>
				</div>
				{errors.adminPassword && (
					<p id="admin-password-error" className="font-medium text-red-500 mt-1 text-[14px]">
						{errors.adminPassword.message}
					</p>
				)}
			</div>
			<div className="flex items-center justify-between mb-4">
				<Checkbox<HospitalAdminSignInType> id="rememberMe" register={register} name="rememberMe">
					Remember me
				</Checkbox>
				<Link href="/forgot-password" className="font-medium text-[14px]">
					Forgot Password
				</Link>
			</div>

			<p id="sign-in-note" className="text-[14px]">
				Use your verified hospital credentials. Access is monitored for compliance and security.
			</p>

			{error && (
				<div className="text-red-500 flex items-center mt-4 gap-2 px-6 py-4 border border-red-500 rounded-xl">
					<span>
						<ErrorWarningFill className="size-4" />
					</span>
					<span>{error}</span>
				</div>
			)}
			<Button className="w-full h-11 mt-12" type="submit" disabled={isSubmitting}>
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
