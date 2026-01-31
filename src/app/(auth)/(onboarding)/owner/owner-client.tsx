"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorWarningLine } from "@/icons/error-warning-line";
import { useEffect, useState } from "react";
import { EyeOffLine } from "@/icons/eye-off-line";
import { EyeLine } from "@/icons/eye-line";
import { ownerSchema, OwnerType } from "@/lib/schemas/owner-schema";

export function OwnerClient() {
	const [isVisible, setIsVisible] = useState(false);
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

	useEffect(() => {
		const cache = localStorage.getItem("ONBOARDING_CACHE");
		if (!cache) return;

		const parsed = JSON.parse(cache);
		if (parsed.owner) {
			reset(parsed.owner);
		}
	}, [reset]);

	const onSubmit = (data: OwnerType) => {
		console.log("click", data);
		localStorage.setItem("ONBOARDING_CACHE", JSON.stringify({ owner: data }));
		router.push("/hospital-details");
	};
	return (
		<form onSubmit={handleSubmit(onSubmit)} className="text-gray-800 w-full">
			<div className="mb-8">
				<Label htmlFor="name" className="block mb-3.5">
					Name
				</Label>
				<Input
					id="name"
					type="text"
					placeholder="eg., John Doe"
					className="h-11"
					{...register("name")}
					aria-labelledby={errors.name ? "name-error" : undefined}
					aria-invalid={!!errors.name}
				/>
				{errors.name && (
					<p id="name-error" className="font-medium text-red-500 mt-1 text-[14px]">
						{errors.name.message}
					</p>
				)}
			</div>
			<div className="mb-8">
				<Label htmlFor="email" className="block mb-3.5">
					Email
				</Label>
				<Input
					id="email"
					placeholder="eg., john.doe@stmaryhospital.org"
					type="email"
					className="h-11"
					{...register("email")}
					aria-labelledby={errors.email ? "email-error" : "email-info"}
					aria-invalid={!!errors.email}
				/>
				{errors.email ? (
					<p id="email-error" className="font-medium text-red-500 mt-2 text-sm">
						{errors.email.message}
					</p>
				) : (
					<div className="text-sm flex gap-1 items-center mt-2 text-gray-400">
						<span aria-hidden>
							<ErrorWarningLine className="size-4" />
						</span>
						<p id="email-info">Use your official hospital email</p>
					</div>
				)}
			</div>

			<Label htmlFor="password" className="block mb-3.5">
				Password
			</Label>
			<div className="relative">
				<Input
					id="password"
					type={isVisible ? "text" : "password"}
					placeholder="Enter a secure password"
					className="h-11"
					{...register("password")}
					aria-describedby={errors.password ? "password-error" : undefined}
					aria-invalid={!!errors.password}
				/>
				<button
					type="button"
					aria-pressed={isVisible}
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
			{errors.password && (
				<p id="password-error" className="font-medium text-red-500 mt-2 text-sm">
					{errors.password.message}
				</p>
			)}

			<Button className="w-full h-11 mt-16" type="submit">
				Continue
			</Button>
		</form>
	);
}
