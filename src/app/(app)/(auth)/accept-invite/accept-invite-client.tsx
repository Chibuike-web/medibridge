"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { acceptInviteSchema, AcceptInviteType } from "@/features/auth/schemas/accept-invite-schema";
import { SuccessModal } from "@/components/success-modal";
import { DialogFooter } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useShowSuccess } from "@/hooks/use-show-success";
import {
	RiCheckboxCircleFill,
	RiErrorWarningFill,
	RiEyeLine,
	RiEyeOffLine,
	RiInformationLine,
} from "@remixicon/react";

export function AcceptInviteClient() {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [error] = useState("");
	const [success] = useState("");
	const { isSuccessModalOpen, setIsSuccessModalOpen } = useShowSuccess();
	const router = useRouter();
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({ resolver: zodResolver(acceptInviteSchema) });

	const onSubmit = async (data: AcceptInviteType) => {
		console.log("click", data);
	};
	return (
		<>
			<form onSubmit={handleSubmit(onSubmit)} className="text-gray-800">
				<div className="mb-6">
					<Label htmlFor="email" className="block mb-2 text-sm">
						Email
					</Label>
					<Input
						id="email"
						placeholder="sarah.thompson@stmaryhospital.org"
						type="email"
						aria-describedby="email-info"
					/>
					<p id="email-info" className="flex gap-1 items-center mt-2">
						<RiInformationLine className="text-gray-400 size-4" aria-hidden="true" />
						<span className="text-sm text-gray-400">Must be official verified hospital email</span>
					</p>
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

				{success && (
					<div className="mt-4 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
						<span>
							<RiCheckboxCircleFill className="size-4" aria-hidden="true" />
						</span>
						<span>{success}</span>
					</div>
				)}

				{error && (
					<div className="mt-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
						<span className="shrink-0">
							<RiErrorWarningFill className="size-4" aria-hidden="true" />
						</span>
						<span>{error}</span>
					</div>
				)}
				<Button className="mt-16 w-full text-sm" type="submit" disabled={isSubmitting}>
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

			{isSuccessModalOpen && (
				<SuccessModal
					isOpen={isSuccessModalOpen}
					setIsOpen={setIsSuccessModalOpen}
					heading="Account Set up Completed"
					description="You have successfully setup your account. Your designated role is administrator  for this organization"
				>
					<DialogFooter className="border-t border-gray-200 w-full text-sm">
						<Button
							className="w-full text-sm"
							onClick={() => router.push("/dashboard")}
						>
							Continue to Dashboard
						</Button>
					</DialogFooter>
				</SuccessModal>
			)}
		</>
	);
}
