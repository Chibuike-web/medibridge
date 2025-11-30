"use client";

import Checkbox from "@/components/ui/checkbox";
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
				<Checkbox
					id={c.id}
					key={c.id}
					defaultChecked={c.status !== "pending"}
					className="text-[16px]"
				>
					{c.value}
				</Checkbox>
			))}
		</div>
	);
}
