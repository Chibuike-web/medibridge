"use client";

import { Button } from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import Password from "@/components/ui/password";
import { Label } from "@radix-ui/react-label";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminClient() {
	const router = useRouter();

	return (
		<div className="px-6 xl:px-0">
			<div className="max-w-[800px] mx-auto py-8">
				<Link href="/uploads" className="flex gap-2 w-max">
					<ArrowLeft /> <span>Back</span>
				</Link>
			</div>
			<div className="max-w-[550px] mx-auto">
				<div className="mb-12">
					<h1 className="text-[1.8rem] text-center font-semibold leading-[1.2] mt-10">
						Administrator Account Setup
					</h1>
					<p className="text-center mt-5 text-gray-600">
						Create your institution’s administrator account.
					</p>
					<p className="text-center text-gray-600">
						This user will manage settings and onboard other hospital staff.
					</p>
				</div>
				<form
					className="w-full"
					onSubmit={(e) => {
						e.preventDefault();
						router.push("/admin");
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
			</div>
		</div>
	);
}
