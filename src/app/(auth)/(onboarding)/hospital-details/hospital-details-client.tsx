"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useVerificationFileUpload } from "@/hooks/use-verification-file-upload";
import { useEffect, useState, useTransition } from "react";
import { createHospitalAction } from "@/actions/create-hospital-action";
import { CheckCircle } from "@/icons/check-circle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { hospitalDetailsSchema, HospitalDetailsType } from "@/lib/schemas/hospital-details-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorWarningFill } from "@/icons/error-warning-fill";
import { createOwnerAction } from "@/actions/create-owner-action";
import { FileUploadCard } from "@/components/file-upload-card";
import { ChooseFileCard } from "@/components/choose-file-card";

export function HospitalDetailsClient() {
	const router = useRouter();
	const {
		file,
		status,
		uploadType,
		setUploadError,
		uploadError,
		uploadRef,
		onClear,
		handleFileChange,
	} = useVerificationFileUpload();
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isPending, startTransition] = useTransition();

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(hospitalDetailsSchema),
		defaultValues: {
			hospitalName: "",
			hospitalAddress: "",
		},
	});

	useEffect(() => {
		const cache = localStorage.getItem("ONBOARDING_CACHE");
		if (!cache) return;

		const parsed = JSON.parse(cache);
		if (parsed.hosptial) {
			reset(parsed.hospital);
		}
	}, [reset]);

	const onSubmit = (data: HospitalDetailsType) => {
		setError("");
		if (!file) {
			setUploadError("No file is uploaded. Please upload a file");
			return;
		}
		const cache = JSON.parse(localStorage.getItem("ONBOARDING_CACHE") || "{}");
		localStorage.setItem(
			"ONBOARDING_CACHE",
			JSON.stringify({
				...cache,
				hospital: data,
			}),
		);
		startTransition(async () => {
			try {
				const res = await createOwnerAction(cache.owner);
				if (res?.status === "failed") {
					setError(res.message || "Account creation failed");
					return;
				}
			} catch (error) {
				setError(error instanceof Error ? error.message : "Unknown error");
				return;
			}
			try {
				const res = await createHospitalAction(data);
				if (res?.status === "failed") {
					setError(res.message || "Hospital creation failed");
					return;
				}
				setSuccess("Hospital successfully created");

				setTimeout(() => {
					localStorage.removeItem("ONBOARDING_CACHE");
					router.replace("/verify");
					reset();
					onClear();
					setSuccess("");
				}, 1000);
			} catch (error) {
				setError(error instanceof Error ? error.message : "Unknown error");
			}
		});
	};

	return (
		<form className="w-full" onSubmit={handleSubmit(onSubmit)}>
			<div className="mb-8">
				<Label htmlFor="hospitalName" className="block mb-3.5">
					Hospital Name
				</Label>
				<Input
					id="hospitalName"
					type="text"
					placeholder="eg., St. Mary's General Hospital"
					className="h-11"
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
			<div className="mb-8">
				<Label htmlFor="hospitalAddress" className="block mb-3.5">
					Hospital Address
				</Label>
				<Input
					id="hospitalAddress"
					type="text"
					placeholder="eg., 123 Healthway Blvd, Springfield, IL"
					className="h-11"
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
			<p className="text-gray-600 mb-3.5">
				Upload hospital accreditation or official license document
			</p>

			{file ? (
				<FileUploadCard
					file={file}
					onClear={onClear}
					status={status}
					uploadType={uploadType}
					uploadError={uploadError}
				/>
			) : (
				<ChooseFileCard
					handleFileChange={handleFileChange}
					uploadRef={uploadRef}
					error={uploadError}
					errorId="file-upload-error"
				/>
			)}
			{uploadError && (
				<p
					id="file-upload-error"
					className="text-red-500 font-medium text-[14px] mt-2"
					role="alert"
				>
					{uploadError}
				</p>
			)}

			{error && (
				<div className="text-red-500 flex items-center mt-4 gap-2 px-4 py-4 border bg-red-100 border-red-500 rounded-xl">
					<span>
						<ErrorWarningFill className="size-4" />
					</span>
					<span>{error}</span>
				</div>
			)}
			{success && (
				<div className="flex items-center gap-2 px-4 py-4 mt-4 bg-green-100 text-green-700 text-sm font-medium rounded-md border border-green-200">
					<span>
						<CheckCircle className="size-5" />
					</span>
					<span>{success}</span>
				</div>
			)}
			<Button className="w-full h-11 mt-16" type="submit" disabled={isPending}>
				{isPending ? (
					<span className="flex items-center gap-2">
						<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
						Creating...
					</span>
				) : (
					"Create account"
				)}
			</Button>
		</form>
	);
}
