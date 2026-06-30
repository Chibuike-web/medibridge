"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { ownerSchema, OwnerType } from "@/features/auth/schemas/owner-schema";
import { RiEyeLine, RiEyeOffLine, RiInformationLine } from "@remixicon/react";

export function OwnerClient() {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const router = useRouter();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(ownerSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
	});

	useEffect(
		function restoreOwnerFromCache() {
			const cache = localStorage.getItem("ONBOARDING_CACHE");
			if (!cache) return;

			const parsed = JSON.parse(cache);
			if (parsed.owner) {
				reset(parsed.owner);
			}
		},
		[reset],
	);

	function onSubmit(data: OwnerType) {
		console.log("click", data);
		localStorage.setItem("ONBOARDING_CACHE", JSON.stringify({ owner: data }));
		router.push("/hospital-details");
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
				<button
					type="button"
					aria-pressed={isPasswordVisible}
					aria-label={isPasswordVisible ? "Hide password" : "Show password"}
					className="absolute right-4 top-1/2 -translate-y-1/2"
					onClick={() => setIsPasswordVisible(!isPasswordVisible)}
				>
					<span aria-hidden="true">
						{isPasswordVisible ? (
							<RiEyeOffLine className="size-4 text-gray-600" />
						) : (
							<RiEyeLine className="size-4 text-gray-600" />
						)}
					</span>
				</button>
			</div>
			{errors.password && (
				<p id="password-error" className="font-medium text-red-500 mt-2 text-sm">
					{errors.password.message}
				</p>
			)}

			<Button className="w-full text-sm mt-16" type="submit">
				Continue
			</Button>
		</form>
	);
}
