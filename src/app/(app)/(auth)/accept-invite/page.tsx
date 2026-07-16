import { AcceptInviteClient } from "./accept-invite-client";

export const metadata = {
	title: "Accept Invite",
};

export default function AcceptInvite() {
	return (
		<main className="max-w-[37.5rem] mx-auto  min-h-dvh grid place-items-center">
			<div className="w-full px-6 md:px-0 ">
				<div className="mb-10">
					<h1 className="mb-4 text-center text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800">
						Complete Account Setup
					</h1>
					<p className="text-center text-gray-600">
						Your details have been pre-filled from your invitation. Create a password to activate
						your member account.
					</p>
				</div>
				<AcceptInviteClient />
			</div>
		</main>
	);
}
