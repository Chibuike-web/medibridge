import { Suspense } from "react";
import { RiLoaderLine } from "@remixicon/react";
import { redirect } from "next/navigation";
import { getSessionData } from "@/lib/api/get-session-data";

export async function DashboardAuth({ children }: { children: React.ReactNode }) {
	if (process.env.NODE_ENV === "development") {
		return <>{children}</>;
	}

	return (
		<Suspense
			fallback={
				<div className="min-h-screen grid place-items-center">
					<div className="flex flex-col gap-2 items-center">
						<RiLoaderLine className="size-6 animate-spin" />
						<span className="text-[1.125rem]">Authenticating....</span>
					</div>
				</div>
			}
		>
			<Main>{children}</Main>
		</Suspense>
	);
}

async function Main({ children }: { children: React.ReactNode }) {
	const data = await getSessionData();
	if (!data) {
		redirect("/sign-in");
	}

	return <>{children}</>;
}
