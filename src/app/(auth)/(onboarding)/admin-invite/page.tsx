"use client";

import Link from "next/link";
import AdminInviteClient from "./admin-invite-client";

export default function Login() {
	return (
		<main className="max-w-[550px] min-h-dvh grid place-items-center mx-auto">
			<div className="w-full px-6 xl:px-0">
				<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] mt-10">
					Invite Administrator
				</h1>
				<p className="text-center mt-4 text-gray-600">
					Invite your hospital’s administrator. They will be assigned an admin role to manage and
					add new members.
				</p>
				<AdminInviteClient />
			</div>
		</main>
	);
}
