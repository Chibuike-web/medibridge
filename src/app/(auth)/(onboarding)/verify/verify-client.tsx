"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";

type CheckboxItem = {
	id: string;
	value: string;
	status: "done" | "pending";
};

export default function VerifyClient() {
	const [checkboxes] = useState<CheckboxItem[]>([
		{ id: "registration", value: "Account created", status: "done" },
		{ id: "emailVerification", value: "Email address verification", status: "pending" },
		{ id: "hospitalVerification", value: "Hospital verification", status: "pending" },
	]);

	return (
		<div className="mt-16 flex flex-col items-center gap-4">
			{checkboxes.map((c) => (
				<Label key={c.id} className={cn("flex items-center gap-2 opacity-50 cursor-not-allowed")}>
					<Checkbox id={c.id} key={c.id} defaultChecked={c.status !== "pending"} disabled />
					{c.value}
				</Label>
			))}
		</div>
	);
}
