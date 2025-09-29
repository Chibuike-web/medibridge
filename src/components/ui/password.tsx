"use client";

import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { Input } from "./input";
import EyeOffLine from "@/icons/eye-off-line";
import EyeLine from "@/icons/eye-line";

export default function Password({
	id,
	label = "Password",
	placeholder = "Enter a secure password",
}: {
	id: string;
	label?: string;
	placeholder?: string;
}) {
	const [isVisible, setIsVisible] = useState(false);
	return (
		<div className="mb-4">
			<Label htmlFor={id} className="mb-1">
				{label}
			</Label>
			<div className="relative">
				<Input
					id={id}
					type={isVisible ? "text" : "password"}
					placeholder={placeholder}
					className="h-11"
				/>
				<button
					type="button"
					aria-label={isVisible ? "Hide password" : "Show password"}
					className="absolute right-4 top-1/2 -translate-y-1/2"
					onClick={() => setIsVisible(!isVisible)}
				>
					{isVisible ? (
						<EyeOffLine className="size-[20px] text-gray-600" />
					) : (
						<EyeLine className="size-[20px] text-gray-600" />
					)}
				</button>
			</div>
		</div>
	);
}
