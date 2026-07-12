"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useVerificationFileUpload } from "@/hooks/use-verification-file-upload";
import { useEffect, useRef, useState, useTransition } from "react";
import { createHospitalAction, createOwnerAction } from "@/features/auth/server/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import {
	hospitalDetailsSchema,
	HospitalDetailsType,
} from "@/features/auth/schemas/hospital-details-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUploadCard } from "@/components/file-upload-card";
import { ChooseFileCard } from "@/components/choose-file-card";
import { RiCheckboxCircleFill, RiErrorWarningFill } from "@remixicon/react";

export function HospitalDetailsClient() {
	const router = useRouter();
	const { file, status, uploadedType, setUploadError, uploadError, onClear, handleFileChange } =
		useVerificationFileUpload();
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

	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(
		function restoreHospitalDetailsFromCache() {
			const cache = localStorage.getItem("ONBOARDING_CACHE");
			if (!cache) return;

			const parsed = JSON.parse(cache);
			if (parsed.hosptial) {
				reset(parsed.hospital);
			}
		},
		[reset],
	);

	function onSubmit(data: HospitalDetailsType) {
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
	}

	return (
		<form className="w-full" onSubmit={handleSubmit(onSubmit)}>
			<div className="mb-6">
				<Label htmlFor="hospitalName" className="block mb-2 text-sm">
					Hospital Name
				</Label>
				<Input
					id="hospitalName"
					type="text"
					placeholder="eg., St. Mary's General Hospital"
					{...register("hospitalName")}
					aria-describedby={errors.hospitalName ? "hospital-name-error" : undefined}
					aria-invalid={!!errors.hospitalName}
				/>
				{errors.hospitalName && (
					<p id="hospital-name-error" className="font-medium text-red-500 mt-2 text-sm">
						{errors.hospitalName.message}
					</p>
				)}
			</div>
			<div className="mb-6">
				<Label htmlFor="hospitalAddress" className="block mb-2 text-sm">
					Hospital Address
				</Label>
				<Input
					id="hospitalAddress"
					type="text"
					placeholder="eg., 123 Healthway Blvd, Springfield, IL"
					{...register("hospitalAddress")}
					aria-describedby={errors.hospitalAddress ? "hospital-address-error" : undefined}
					aria-invalid={!!errors.hospitalAddress}
				/>
				{errors.hospitalAddress && (
					<p id="hospital-address-error" className="font-medium text-red-500 mt-2 text-sm">
						{errors.hospitalAddress.message}
					</p>
				)}
			</div>
			<p className="text-gray-600 mb-3.5">
				Upload hospital accreditation or official license document
			</p>

			{file ? (
				<FileUploadCard
					name={file.name}
					size={file.size}
					onRemove={onClear}
					status={status}
					extension={uploadedType}
				/>
			) : (
				<ChooseFileCard
					onFilesSelected={handleFileChange}
					title="Choose a file or drag & drop it here."
					description="JPEG, PNG, and PDF, up to 50 MB."
					browseLabel="Browse File"
					fileInputRef={fileInputRef}
					error={uploadError}
					accept="image/jpeg,image/png,application/pdf"
					multiple
					inputId="hospital-file"
				/>
			)}
			{uploadError && (
				<p id="file-upload-error" className="text-red-500 font-medium text-sm mt-2" role="alert">
					{uploadError}
				</p>
			)}

			{error && (
				<div className="mt-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
					<span className="shrink-0">
						<RiErrorWarningFill className="size-4" aria-hidden="true" />
					</span>
					<span>{error}</span>
				</div>
			)}
			{success && (
				<div className="mt-4 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
					<span>
						<RiCheckboxCircleFill className="size-4" aria-hidden="true" />
					</span>
					<span>{success}</span>
				</div>
			)}
			<Button className="w-full mt-16 text-sm" type="submit" disabled={isPending}>
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
