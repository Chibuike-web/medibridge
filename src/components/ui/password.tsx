import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { Input } from "./input";
import { Eye, EyeClosed } from "lucide-react";

export default function Password({ id }: { id: string }) {
	const [isVisible, setIsVisible] = useState(false);
	return (
		<div className="mb-4">
			<Label htmlFor={id} className="mb-1">
				Password
			</Label>
			<div className="relative">
				<Input
					id={id}
					type={isVisible ? "text" : "password"}
					placeholder="Enter a secure password"
					className="h-11"
				/>
				<button
					type="button"
					aria-label={isVisible ? "Hide password" : "Show password"}
					className="absolute right-4 top-1/2 -translate-y-1/2"
					onClick={() => setIsVisible(!isVisible)}
				>
					{isVisible ? (
						<EyeClosed className="size-[20px] text-gray-600" />
					) : (
						<Eye className="size-[20px] text-gray-600" />
					)}
				</button>
			</div>
		</div>
	);
}
