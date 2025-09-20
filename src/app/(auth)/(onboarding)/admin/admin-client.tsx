"use client";

import { Button } from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Password from "@/components/ui/password";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminClient() {
	const router = useRouter();
	return (
		<form
			className="w-full"
			onSubmit={(e) => {
				e.preventDefault();
				router.push("/verify");
			}}
		>
			<div className="mb-4">
				<Label htmlFor="adminName">Admin Name</Label>
				<Input id="adminName" type="text" placeholder="eg., Sarah Thompson" className="h-11" />
			</div>
			<div className="mb-4">
				<Label htmlFor="adminEmail">Admin Email</Label>
				<Input
					id="adminEmail"
					type="text"
					placeholder="sarah.thompson@stmaryhospital.org"
					className="h-11"
					aria-describedby="info"
				/>
				<p id="info" className="flex gap-[4px] items-center mt-2">
					<Info className="text-gray-400 size-4" aria-hidden="true" />
					<span className="text-[14px] text-gray-400">
						Must be official verified hospital email
					</span>
				</p>
			</div>
			<Password id="adminPassword" />
			<Checkbox id="terms">
				<div>
					I agree to the <span className="font-medium text-gray-800">Terms of Use</span> and{" "}
					<span className="font-medium text-gray-800">Privacy Policy</span>
				</div>
			</Checkbox>

			<Button className="w-full h-11 mt-12" type="submit">
				Continue
			</Button>
		</form>
	);
}
