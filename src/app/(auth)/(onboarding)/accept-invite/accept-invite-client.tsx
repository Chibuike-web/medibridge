"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import EyeOffLine from "@/icons/eye-off-line";
import EyeLine from "@/icons/eye-line";
import CheckCircle from "@/icons/check-circle";
import ErrorWarningFill from "@/icons/error-warning-fill";
import { acceptInviteSchema, AcceptInviteType } from "@/lib/schemas/accept-invite-schema";

export default function AcceptInviteClient() {
	const [isVisible, setIsVisible] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const router = useRouter();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({ resolver: zodResolver(acceptInviteSchema) });

	const onSubmit = async (data: AcceptInviteType) => {
		console.log("click", data);
	};
	return (
		<form onSubmit={handleSubmit(onSubmit)} className="text-gray-800">
			<div className="mb-5">
				<Label htmlFor="name" className="block mb-2">
					Name
				</Label>
				<Input id="name" type="text" placeholder="eg., John Doe" className="h-11 mt-1" />
			</div>
			<div className="mb-5">
				<Label htmlFor="email" className="block mb-2">
					Email
				</Label>
				<Input
					id="email"
					placeholder="eg., john.doe@stmaryhospital.org"
					type="email"
					className="h-11 mt-1"
				/>
			</div>

			<div>
				<Label htmlFor="password" className="block mb-2">
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
					<p id="password-error" className="font-medium text-red-500 mt-1 text-[14px]">
						{errors.password.message}
					</p>
				)}
			</div>

			{success && (
				<div className="flex items-center gap-2 px-4 py-4 mt-4 bg-green-100 text-green-700 text-sm font-medium rounded-md border border-green-200 shadow-sm">
					<span>
						<CheckCircle className="size-5" />
					</span>
					<span>{success}</span>
				</div>
			)}

			{error && (
				<div className="text-red-500 flex items-center mt-4 gap-2 px-4 py-4 border bg-red-100 border-red-500 rounded-xl">
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
						Signing up...
					</span>
				) : (
					"Sign up"
				)}
			</Button>
		</form>
	);
}
