import Link from "next/link";
import ArrowLeftLine from "@/icons/arrow-left-line";
import AcceptInviteClient from "./accept-invite-client";

export default function Owner() {
	return (
		<main>
			<div className="max-w-[550px] mx-auto  min-h-[calc(100dvh-90px)] grid place-items-center">
				<div className="w-full px-6 xl:px-0 ">
					<div className="mb-10">
						<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] mb-4">
							Complete Account Setup
						</h1>
						<p className="text-center text-gray-600">
							Your details have been pre-filled from your invitation. Create a password to activate
							your member account.
						</p>
					</div>
					<AcceptInviteClient />
				</div>
			</div>
		</main>
	);
}
