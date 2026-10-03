"use client";

import { SuccessModal } from "@/components/success-modal";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShowSuccess } from "@/hooks/use-show-success";
import { inviteSchema } from "@/features/auth/schemas/invite-schema";
import type { InviteType } from "@/features/auth/schemas/invite-schema";
import { inviteAdminAction } from "@/features/auth/server/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { RiErrorWarningFill, RiInformationLine } from "@remixicon/react";
import { useState, useTransition } from "react";

export function AdminInviteClient() {
	const router = useRouter();
	const { isSuccessModalOpen, setIsSuccessModalOpen } = useShowSuccess();
	const [invitationError, setInvitationError] = useState("");
	const [isPending, startTransition] = useTransition();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<InviteType>({
		resolver: zodResolver(inviteSchema),
		defaultValues: { name: "", email: "" },
	});

	const onSubmit = (data: InviteType) => {
		setInvitationError("");

		startTransition(async () => {
			try {
				const response = await inviteAdminAction(data);

				if (response.status === "unauthorized") {
					router.replace("/sign-in");
					return;
				}

				if (response.status === "forbidden" || response.status === "failed") {
					setInvitationError(response.error);
					return;
				}

				reset();
				setIsSuccessModalOpen(true);
			} catch (error) {
				setInvitationError(
					error instanceof Error ? error.message : "Unable to send the invitation.",
				);
			}
		});
	};

	return (
		<>
			<form className="text-gray-800 mt-12" onSubmit={handleSubmit(onSubmit)} noValidate>
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

				{invitationError && (
					<div
						className="mt-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
						role="alert"
					>
						<RiErrorWarningFill className="size-4 shrink-0" aria-hidden="true" />
						<span>{invitationError}</span>
					</div>
				)}

				<Button className="w-full mt-16" type="submit" disabled={isSubmitting || isPending}>
					{isPending ? (
						<span className="flex items-center gap-2">
							<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							Sending invite...
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
					<DialogFooter className="w-full text-sm">
						<Button className="w-full" onClick={() => router.push("/dashboard/overview")}>
							Continue to Dashboard
						</Button>
					</DialogFooter>
				</SuccessModal>
			)}
		</>
	);
}
