"use client";

import Checkbox from "@/components/ui/checkbox";
import { useHospitalStore } from "@/store/use-hospital-store";
import { useState } from "react";

type CheckboxItem = {
	id: string;
	value: string;
	status: "submitted" | "pending" | "verified";
};

export default function VerifyClient() {
	const { hospitalInfo } = useHospitalStore();
	console.log(hospitalInfo);
	const [checkboxes] = useState<CheckboxItem[]>([
		{ id: "registration", value: "Registration", status: "submitted" },
		{ id: "emailVerification", value: "Email Verification", status: "pending" },
		{ id: "institutionalVerification", value: "Institutional Verification", status: "pending" },
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
					{c.value} - {c.status}
				</Checkbox>
			))}
		</div>
	);
}
