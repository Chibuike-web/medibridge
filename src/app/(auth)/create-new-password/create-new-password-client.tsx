"use client";

import { Button } from "@/components/ui/button";
import Password from "@/components/ui/password";
import { useRouter } from "next/navigation";
export default function CreateNewPasswordClient() {
	const router = useRouter();
	return (
		<form
			aria-describedby="login-note"
			onSubmit={(e) => {
				e.preventDefault();
				router.push("/create-new-password/verify");
			}}
			className="text-gray-800 mt-12"
		>
			<Password id="newPassword" label="New Passoword" placeholder="Enter new password" />
			<Password
				id="confirmNewPassword"
				label="Confirm New Password"
				placeholder="Confirm new password"
			/>

			<Button className="w-full h-11 mt-12" type="submit">
				Reset Password
			</Button>
		</form>
	);
}
