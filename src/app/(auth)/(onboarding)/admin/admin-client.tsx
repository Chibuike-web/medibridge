"use client";

import { Button } from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InformationLine from "@/icons/information-line";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hospitalAdminSchema, HospitalAdminType } from "@/lib/schemas/hospital-admin-schema";
import { useState } from "react";
import EyeOffLine from "@/icons/eye-off-line";
import EyeLine from "@/icons/eye-line";
import ErrorWarningFill from "@/icons/error-warning-fill";
import CheckCircle from "@/icons/check-circle";

export default function AdminClient() {
	const router = useRouter();
	const [isVisible, setIsVisible] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({ resolver: zodResolver(hospitalAdminSchema) });

	const onSubmit = async (data: HospitalAdminType) => {
		setError("");
		setSuccess("");
	};
	return (
		<>
			{success && (
				<div className="flex items-center gap-2 px-4 py-4 mb-4 bg-green-100 text-green-700 text-sm font-medium rounded-md border border-green-200 shadow-sm">
					<span>
						<CheckCircle className="size-5" />
					</span>
					<span>{success}</span>
				</div>
			)}
			<form className="w-full" onSubmit={handleSubmit(onSubmit)}>
				<div className="mb-4">
					<Label htmlFor="name" className="block mb-2">
						Name
					</Label>
					<Input
						id="name"
						type="text"
						placeholder="eg., Sarah Thompson"
						className="h-11"
						{...register("name")}
						aria-invalid={!!errors.name}
						aria-describedby={errors.name ? "name-error" : undefined}
					/>
					{errors.name && (
						<p id="name-error" className="font-medium text-red-500 mt-1 text-[14px]">
							{errors.name.message}
						</p>
					)}
				</div>
				<div className="mb-4">
					<Label htmlFor="email" className="block mb-2">
						Email
					</Label>
					<Input
						id="email"
						type="text"
						placeholder="sarah.thompson@stmaryhospital.org"
						className="h-11"
						{...register("email")}
						aria-invalid={!!errors.email}
						aria-describedby={errors.email ? "email-error" : "email-info"}
					/>
					{errors.email && (
						<p id="email-error" className="font-medium text-red-500 mt-1 text-[14px]">
							{errors.email.message}
						</p>
					)}
					{!errors.email && (
						<p id="email-info" className="flex gap-1 items-center mt-2">
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
						<p id="password-error" className="font-medium bg-red-100 text-red-500 mt-1 text-[14px]">
							{errors.password.message}
						</p>
					)}
				</div>
				<Checkbox<HospitalAdminType>
					id="terms"
					register={register}
					name="terms"
					ariaInvalid={!!errors.terms}
					ariaDescribedBy={errors.terms ? "terms-error" : undefined}
				>
					<div>
						I agree to the <span className="font-medium text-gray-800">Terms of Use</span> and{" "}
						<span className="font-medium text-gray-800">Privacy Policy</span>
					</div>
				</Checkbox>
				{errors.terms && (
					<p id="terms-error" className="font-medium text-red-500 mt-1 text-[14px]">
						{errors.terms.message}
					</p>
				)}

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
							Signing up...
						</span>
					) : (
						"Continue"
					)}
				</Button>
			</form>
		</>
	);
}
