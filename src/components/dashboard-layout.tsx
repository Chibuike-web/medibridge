import { getSessionData } from "@/api/get-session-data";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<Suspense
			fallback={<div className="min-h-screen grid place-items-center">Authenticating....</div>}
		>
			<Main>{children}</Main>
		</Suspense>
	);
}

async function Main({ children }: { children: React.ReactNode }) {
	const session = await getSessionData();
	if (!session) {
		redirect("/sign-in");
	}
	return (
		<main className="flex h-screen">
			<Sidebar />
			<div className="flex flex-col flex-1 overflow-auto">
				<Topbar />
				<>{children}</>
			</div>
		</main>
	);
}
