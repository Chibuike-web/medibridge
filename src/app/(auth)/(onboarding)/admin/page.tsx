import AdminClient from "./admin-client";

export default function Admin() {
	return (
		<main className="grid place-items-center min-h-screen">
			<div className="max-w-[550px] mx-auto px-6 xl:px-0">
				<div className="mb-12">
					<h1 className="text-[1.8rem] text-gray-800 tracking-[-0.02em] text-center font-semibold leading-[1.2] mt-10">
						Administrator Account Setup
					</h1>
					<p className="text-center mt-5 text-gray-600">
						Create your institution’s administrator account.
					</p>
					<p className="text-center text-gray-600">
						This user will manage settings and onboard other hospital staff.
					</p>
				</div>
				<AdminClient />
			</div>
		</main>
	);
}
