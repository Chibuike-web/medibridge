"use client";

import Checkbox from "@/components/ui/checkbox";
import Image from "next/image";
import { useState } from "react";

type CheckboxItem = {
	id: string;
	value: string;
	status: "submitted" | "pending" | "verified";
};

export default function Verify() {
	const [checkboxes] = useState<CheckboxItem[]>([
		{ id: "registration", value: "Registration", status: "submitted" },
		{ id: "emailVerification", value: "Email Verification", status: "pending" },
		{ id: "institutionalVerification", value: "Institutional Verification", status: "pending" },
	]);

	return (
		<main className="max-w-[600px] min-h-dvh grid place-items-center mx-auto">
			<div className="flex flex-col items-center">
				<Image src="/assets/verification-icon.svg" width={160} height={160} alt="" />

				<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] mt-10">
					Verification In Progress
				</h1>
				<p className="text-gray-600 font-medium text-center mt-6">
					Your registration is in progress. You’ll be notified via email once both your institution
					and account have been verified.
				</p>
				<div className="mt-16 flex flex-col items-center gap-4">
					{checkboxes.map((c) => (
						<Checkbox
							id={c.id}
							key={c.id}
							checked={c.status === "pending" ? false : true}
							className="text-[16px]"
						>
							{c.value} {c.status}
						</Checkbox>
					))}
				</div>
			</div>
		</main>
	);
}
