"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function InfoClient() {
	const router = useRouter();
	return (
		<div className="px-6 xl:px-0">
			<div className="max-w-[800px] mx-auto py-8">
				<Link href="/" className="flex gap-2 w-max">
					<ArrowLeft /> <span>Back</span>
				</Link>
			</div>
			<div className="max-w-[550px] mx-auto">
				<h1 className="text-[1.8rem] text-center font-semibold leading-[1.2] my-10">
					Institution Details
				</h1>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						router.push("/uploads");
					}}
				>
					<div className="mb-4">
						<Label htmlFor="hospitalName">Hospital Name</Label>
						<Input
							id="hospitalName"
							type="text"
							placeholder="eg., St. Mary's General Hospital"
							className="h-11 mt-1"
						/>
					</div>
					<div className="mb-4">
						<Label htmlFor="registeredAddress">Registered Address</Label>
						<Input
							id="registeredAddress"
							type="text"
							placeholder="eg., 123 Healthway Blvd, Springfield, IL"
							className="h-11 mt-1"
						/>
					</div>
					<div className="mb-4">
						<Label htmlFor="primaryContactName">Primary Contact Name</Label>
						<Input
							id="primaryContactName"
							type="text"
							placeholder="eg., John Doe"
							className="h-11 mt-1"
						/>
					</div>
					<div className="mb-4">
						<Label htmlFor="primaryContactEmail">Primary Contact Email</Label>
						<Input
							id="primaryContactEmail"
							placeholder="eg., john.doe@stmaryhospital.org"
							type="email"
							className="h-11 mt-1"
						/>
					</div>
					<div>
						<Label htmlFor="primaryContactPhoneNumber">Primary Contact Phone number</Label>
						<Input
							id="primaryContactPhoneNumber"
							placeholder="eg., +1 (312) 555-0198"
							type="text"
							className="h-11 mt-1"
						/>
					</div>
					<Button className="w-full h-11 mt-12" type="submit">
						Continue
					</Button>
				</form>
			</div>
		</div>
	);
}
