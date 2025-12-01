import { getSessionData } from "@/lib/api/get-session-data";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import UserContextProvider from "@/contexts/user-context";

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
	const data = await getSessionData();
	if (!data) {
		redirect("/sign-in");
	}
	return (
		<UserContextProvider user={data.user}>
			<main className="flex h-screen">
				<Sidebar />
				<div className="flex flex-col flex-1 overflow-auto">
					<Topbar />
					<>{children}</>
				</div>
			</main>
		</UserContextProvider>
	);
}
