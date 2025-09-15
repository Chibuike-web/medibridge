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
				<Link href="/" className="flex gap-2">
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
						<Label>Hospital Name</Label>
						<Input placeholder="eg., St. Mary's General Hospital" className="h-11 mt-1" />
					</div>
					<div className="mb-4">
						<Label>Registered Address</Label>
						<Input placeholder="eg., 123 Healthway Blvd, Springfield, IL" className="h-11 mt-1" />
					</div>
					<div className="mb-4">
						<Label>Primary Contact Name</Label>
						<Input placeholder="eg., John Doe" className="h-11 mt-1" />
					</div>
					<div className="mb-4">
						<Label>Primary Contact Email</Label>
						<Input placeholder="eg., john.doe@stmaryhospital.org" className="h-11 mt-1" />
					</div>
					<div>
						<Label>Primary Contact Phone number</Label>
						<Input placeholder="eg., +1 (312) 555-0198" className="h-11 mt-1" />
					</div>
					<Button className="w-full h-11 mt-12" type="submit">
						Continue
					</Button>
				</form>
			</div>
		</div>
	);
}
