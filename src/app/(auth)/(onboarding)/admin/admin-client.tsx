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
import { useHospitalStore } from "@/store/use-hospital-store";
import saveHospital from "@/actions/save-hospital-action";
import ErrorWarningFill from "@/icons/error-warning-fill";
import CheckCircle from "@/icons/check-circle";
import { useVerificationUpload } from "@/store/use-verification-upload-store";

export default function AdminClient() {
	const router = useRouter();
	const [isVisible, setIsVisible] = useState(false);
	const { hospitalInfo, setHospitalInfo, clearHospitalInfo } = useHospitalStore();
	const { onClear } = useVerificationUpload();
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({ resolver: zodResolver(hospitalAdminSchema) });

	const onSubmit = async (data: HospitalAdminType) => {
		setHospitalInfo(data);
		const fullData = hospitalInfo;
		if (!fullData) return;
		console.log(fullData);
		try {
			const response = await saveHospital(fullData);
			if (response.status === "failed") {
				console.error(response.error);
				setError(response.error || "");
			} else if (response.status === "success") {
				console.log(response.message);
				setSuccess(response.message || "");
			}
			router.replace("/verify");

			setTimeout(() => {
				clearHospitalInfo();
				reset();
				onClear();
				setSuccess("");
				localStorage.removeItem("hospitalInfo");
			}, 1000);
		} catch (error) {
			console.error(error);
		}
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
					<Label htmlFor="adminName" className="block mb-2">
						Admin Name
					</Label>
					<Input
						id="adminName"
						type="text"
						placeholder="eg., Sarah Thompson"
						className="h-11"
						{...register("adminName")}
						aria-invalid={!!errors.adminName}
						aria-describedby={errors.adminName ? "admin-name-error" : undefined}
					/>
					{errors.adminName && (
						<p id="admin-name-error" className="font-medium text-red-500 mt-1 text-[14px]">
							{errors.adminName.message}
						</p>
					)}
				</div>
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
					<Label htmlFor="adminPassword" className="block mb-2">
						Admin Password
					</Label>
					<div className="relative">
						<Input
							id="adminPassword"
							type={isVisible ? "text" : "password"}
							placeholder="Enter a secure password"
							className="h-11"
							{...register("adminPassword")}
							aria-describedby={errors.adminPassword ? "admin-password-error" : undefined}
							aria-invalid={!!errors.adminPassword}
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
					{errors.adminPassword && (
						<p id="admin-password-error" className="font-medium text-red-500 mt-1 text-[14px]">
							{errors.adminPassword.message}
						</p>
					)}
				</div>
				<Checkbox<HospitalAdminType>
					id="terms"
					register={register}
					name="checkbox"
					ariaInvalid={!!errors.checkbox}
					ariaDescribedBy={errors.checkbox ? "checkbox-error" : undefined}
				>
					<div>
						I agree to the <span className="font-medium text-gray-800">Terms of Use</span> and{" "}
						<span className="font-medium text-gray-800">Privacy Policy</span>
					</div>
				</Checkbox>
				{errors.checkbox && (
					<p id="checkbox-error" className="font-medium text-red-500 mt-1 text-[14px]">
						{errors.checkbox.message}
					</p>
				)}

				{error && (
					<div className="text-red-500 flex items-center gap-2 px-6 py-4 border border-red-500 rounded-xl">
						<span>
							<ErrorWarningFill className="size-4" />
						</span>
						<span>{error}</span>
					</div>
				)}
				<Button className="w-full h-11 mt-12" type="submit" disabled={isSubmitting}>
					Continue
				</Button>
			</form>
		</>
	);
}
