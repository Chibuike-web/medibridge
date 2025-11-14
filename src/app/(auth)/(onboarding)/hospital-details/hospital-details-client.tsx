"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hospitalDetailsSchema, HospitalDetailsType } from "@/lib/schemas/hospital-details-schema";
import { useHospitalStore } from "@/store/use-hospital-store";
import ErrorWarningLine from "@/icons/error-warning-line";
import { useEffect } from "react";

export default function HospitalDetailsClient() {
	const { hospitalInfo, hydrated, setHospitalInfo } = useHospitalStore();

	const router = useRouter();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({ resolver: zodResolver(hospitalDetailsSchema), defaultValues: hospitalInfo ?? {} });

	useEffect(() => {
		if (!hydrated) return;

		const raw = localStorage.getItem("hospital");
		if (!raw) return;

		try {
			const data = JSON.parse(raw);
			console.log(data);
			reset(data.state.hospitalInfo);
		} catch {
			console.error("Invalid hospital data in storage");
		}
	}, [hydrated, reset]);

	const onSubmit = (data: HospitalDetailsType) => {
		setHospitalInfo(data);
		router.push("/hospital-upload");
	};
	return (
		<form onSubmit={handleSubmit(onSubmit)} className="text-gray-800">
			<div className="mb-5">
				<Label htmlFor="hospitalName" className="block mb-2">
					Hospital Name
				</Label>
				<Input
					id="hospitalName"
					type="text"
					placeholder="eg., St. Mary's General Hospital"
					className="h-11 mt-1"
					{...register("hospitalName")}
					aria-labelledby={errors.hospitalName ? "hospital-name-error" : undefined}
					aria-invalid={!!errors.hospitalName}
				/>
				{errors.hospitalName && (
					<p id="hospital-name-error" className="font-medium text-red-500 mt-1 text-[14px]">
						{errors.hospitalName.message}
					</p>
				)}
			</div>
			<div className="mb-5">
				<Label htmlFor="hospitalAddress" className="block mb-2">
					Hospital Address
				</Label>
				<Input
					id="hospitalAddress"
					type="text"
					placeholder="eg., 123 Healthway Blvd, Springfield, IL"
					className="h-11 mt-1"
					{...register("hospitalAddress")}
					aria-labelledby={errors.hospitalAddress ? "hospital-address-error" : undefined}
					aria-invalid={!!errors.hospitalAddress}
				/>
				{errors.hospitalAddress && (
					<p id="hospital-address-error" className="font-medium text-red-500 mt-1 text-[14px]">
						{errors.hospitalAddress.message}
					</p>
				)}
			</div>
			<div className="mb-5">
				<Label htmlFor="primaryContactName" className="block mb-2">
					Primary Contact Name
				</Label>
				<Input
					id="primaryContactName"
					type="text"
					placeholder="eg., John Doe"
					className="h-11 mt-1"
					{...register("primaryContactName")}
					aria-labelledby={errors.primaryContactName ? "primary-contact-name-error" : undefined}
					aria-invalid={!!errors.primaryContactName}
				/>
				{errors.primaryContactName && (
					<p id="primary-contact-name-error" className="font-medium text-red-500 mt-1 text-[14px]">
						{errors.primaryContactName.message}
					</p>
				)}
			</div>
			<div className="mb-5">
				<Label htmlFor="primaryContactEmail" className="block mb-2">
					Primary Contact Email
				</Label>
				<Input
					id="primaryContactEmail"
					placeholder="eg., john.doe@stmaryhospital.org"
					type="email"
					className="h-11 mt-1"
					{...register("primaryContactEmail")}
					aria-labelledby={
						errors.primaryContactEmail
							? "primary-contact-email-error"
							: "primary-contact-email-info"
					}
					aria-invalid={!!errors.primaryContactEmail}
				/>
				{errors.primaryContactEmail ? (
					<p id="primary-contact-email-error" className="font-medium text-red-500 mt-1 text-[14px]">
						{errors.primaryContactEmail.message}
					</p>
				) : (
					<div className="text-[14px] flex gap-1 items-center mt-1 text-gray-400">
						<span aria-hidden>
							<ErrorWarningLine className="size-4" />
						</span>
						<p id="primary-contact-email-info">Use your official hospital email</p>
					</div>
				)}
			</div>
			<div>
				<Label htmlFor="primaryContactPhoneNumber" className="block mb-2">
					Primary Contact Phone number
				</Label>
				<Input
					id="primaryContactPhoneNumber"
					placeholder="eg., +1 (312) 555-0198"
					type="text"
					className="h-11 mt-1"
					{...register("primaryContactPhoneNumber")}
					aria-labelledby={
						errors.primaryContactPhoneNumber ? "primary-contact-phone-number-error" : undefined
					}
					aria-invalid={!!errors.primaryContactPhoneNumber}
				/>
				{errors.primaryContactPhoneNumber && (
					<p
						id="primary-contact-phone-number-error"
						className="font-medium text-red-500 mt-1 text-[14px]"
					>
						{errors.primaryContactPhoneNumber.message}
					</p>
				)}
			</div>
			<Button className="w-full h-11 mt-12" type="submit" disabled={isSubmitting}>
				Continue
			</Button>
		</form>
	);
}
