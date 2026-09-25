import { redirect } from "next/navigation";

export const metadata = {
	title: "Create New Password Success",
};

export default function PasswordResetSuccess() {
	redirect("/sign-in");
}
