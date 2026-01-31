"use client";

import { SuccessModal } from "@/components/success-modal";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShowSuccess } from "@/hooks/use-show-success";
import { InformationLine } from "@/icons/information-line";
import { inviteSchema } from "@/lib/schemas/invite-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export function AdminInviteClient() {
	const router = useRouter();
	const { showSuccess, setShowSuccess } = useShowSuccess();
	const {
		register,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(inviteSchema),
	});

	return (
		<>
			<form aria-describedby="sign-in-note" className="text-gray-800 mt-12">
				<div className="mb-8">
					<Label htmlFor="email" className="block mb-3.5">
						Name
					</Label>
					<Input
						id="name"
						type="text"
						placeholder="e.g., Sarah Thompson"
						className="h-11"
						{...register("name")}
						aria-invalid={!!errors.email}
						aria-describedby={errors.email ? "name-error" : undefined}
					/>
					{errors.name && (
						<p id="name-error" className="font-medium text-red-500 mt-2 text-sm">
							{errors.name.message}
						</p>
					)}
				</div>

				<Label htmlFor="email" className="block mb-3.5">
					Email Address
				</Label>
				<Input
					id="email"
					type="email"
					placeholder="sarah.thompson@stmaryhospital.org"
					className="h-11"
					{...register("email")}
					aria-invalid={!!errors.email}
					aria-describedby={errors.email ? "email-error" : "email-info"}
				/>
				{errors.email && (
					<p id="email-error" className="font-medium text-red-500 mt-2 text-sm">
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

				<Button className="w-full h-11 mt-16" type="submit" disabled={isSubmitting}>
					{isSubmitting ? (
						<span className="flex items-center gap-2">
							<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							Inviting in...
						</span>
					) : (
						"Send Invite"
					)}
				</Button>
			</form>
			{showSuccess && (
				<SuccessModal
					isOpen={showSuccess}
					setIsOpen={setShowSuccess}
					heading="Admin Invitation Sent"
					description="The administrator has been successfully invited. They will receive an email to set up their account and start managing members."
				>
					<DialogFooter className="border-t border-gray-200 w-full">
						<Button
							className="h-11 w-full cursor-pointer"
							onClick={() => router.push("/dashboard/overview")}
						>
							Continue to Dashboard
						</Button>
					</DialogFooter>
				</SuccessModal>
			)}
		</>
	);
}
