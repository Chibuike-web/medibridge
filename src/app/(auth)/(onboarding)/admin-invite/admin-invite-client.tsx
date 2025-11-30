"use client";

import { signInAction } from "@/actions/sign-in-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InformationLine from "@/icons/information-line";
import { inviteSchema, InviteType } from "@/lib/schemas/invite-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function AdminInviteClient() {
	const router = useRouter();
	const [error, setError] = useState("");

	const {
		register,
		reset,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(inviteSchema),
	});

	const onSubmit = async (data: InviteType) => {
		setError("");
		try {
			const response = await signInAction(data);
			if (response.status === "failed") {
				console.error(response.error);
				setError(response.error || "");
				return;
			} else if (response.status === "success") {
				router.replace("/");

				setTimeout(() => {
					reset();
				}, 1000);
			}
		} catch (error) {
			setError(error instanceof Error ? error.message : "Unknown error");
		}
	};

	return (
		<form
			aria-describedby="sign-in-note"
			onSubmit={handleSubmit(onSubmit)}
			className="text-gray-800 mt-12"
		>
			<div className="mb-4">
				<Label htmlFor="email" className="block mb-2">
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
					<p id="name-error" className="font-medium text-red-500 mt-1 text-[14px]">
						{errors.name.message}
					</p>
				)}
			</div>
			<div>
				<Label htmlFor="email" className="block mb-2">
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

			<Button className="w-full h-11 mt-12" type="submit" disabled={isSubmitting}>
				{isSubmitting ? (
					<span className="flex items-center gap-2">
						<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
						Inviting in...
					</span>
				) : (
					"Invite"
				)}
			</Button>
		</form>
	);
}
