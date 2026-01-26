import { getSessionData } from "@/lib/api/get-session-data";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoaderLine } from "@/icons/loader-line";

export async function DashboardAuth({ children }: { children: React.ReactNode }) {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen grid place-items-center">
					<div className="flex flex-col gap-2 items-center">
						<LoaderLine className="size-6 animate-spin" />
						<span className="text-18px">Authenticating....</span>
					</div>
				</div>
			}
		>
			<Main>{children}</Main>
		</Suspense>
	);
}

async function Main({ children }: { children: React.ReactNode }) {
	// const data = await getSessionData();
	// if (!data) {
	// 	redirect("/sign-in");
	// }
	return <>{children}</>;
}
