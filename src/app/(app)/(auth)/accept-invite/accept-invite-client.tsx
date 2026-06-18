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
import { RiCheckboxCircleFill, RiErrorWarningFill, RiEyeLine, RiEyeOffLine } from "@remixicon/react";

export function AcceptInviteClient() {
	const [isVisible, setIsVisible] = useState(false);
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
				<div className="mb-8">
					<Label htmlFor="email" className="block mb-3.5">
						Email
					</Label>
					<Input
						id="email"
						placeholder="eg., john.doe@stmaryhospital.org"
						type="email"
						className="h-11"
					/>
				</div>

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
								<RiEyeOffLine className="size-5 text-gray-600" />
							) : (
								<RiEyeLine className="size-5 text-gray-600" />
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
					<div className="flex items-center gap-2 px-4 py-4 mt-4 bg-green-100 text-green-700 text-sm font-medium rounded-md border border-green-200 shadow-sm">
						<span>
							<RiCheckboxCircleFill className="size-5" />
						</span>
						<span>{success}</span>
					</div>
				)}

				{error && (
					<div className="text-red-500 flex items-center mt-4 gap-2 px-4 py-4 border bg-red-100 border-red-500 rounded-xl">
						<span>
							<RiErrorWarningFill className="size-4" />
						</span>
						<span>{error}</span>
					</div>
				)}
				<Button className="w-full h-11 mt-16" type="submit" disabled={isSubmitting}>
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
					<DialogFooter className="border-t border-gray-200 w-full">
						<Button
							className="h-11 w-full cursor-pointer"
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
