"use client";

import { SuccessModal } from "@/components/success-modal";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShowSuccess } from "@/hooks/use-show-success";
import { inviteSchema } from "@/features/auth/schemas/invite-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { RiInformationLine } from "@remixicon/react";

export function AdminInviteClient() {
	const router = useRouter();
	const { isSuccessModalOpen, setIsSuccessModalOpen } = useShowSuccess();
	const {
		register,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(inviteSchema),
	});

	return (
		<>
			<form className="text-gray-800 mt-12">
				<div className="mb-6">
					<Label htmlFor="name" className="block mb-2 text-sm">
						Name
					</Label>
					<Input
						id="name"
						type="text"
						placeholder="e.g., Sarah Thompson"
						{...register("name")}
						aria-invalid={!!errors.name}
						aria-describedby={errors.name ? "name-error" : undefined}
					/>
					{errors.name && (
						<p id="name-error" className="font-medium text-red-500 mt-2 text-sm">
							{errors.name.message}
						</p>
					)}
				</div>

				<div className="mb-6">
					<Label htmlFor="email" className="block mb-2 text-sm">
						Email Address
					</Label>
					<Input
						id="email"
						type="email"
						placeholder="sarah.thompson@stmaryhospital.org"
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
							<RiInformationLine className="text-gray-400 size-4" aria-hidden="true" />
							<span className="text-sm text-gray-400">
								Must be official verified hospital email
							</span>
						</p>
					)}
				</div>

				<Button className="w-full text-sm mt-16" type="submit" disabled={isSubmitting}>
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
			{isSuccessModalOpen && (
				<SuccessModal
					isOpen={isSuccessModalOpen}
					setIsOpen={setIsSuccessModalOpen}
					heading="Admin Invitation Sent"
					description="The administrator has been successfully invited. They will receive an email to set up their account and start managing members."
				>
					<DialogFooter className="border-t border-gray-200 w-full text-sm">
						<Button
							className="w-full text-sm"
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
