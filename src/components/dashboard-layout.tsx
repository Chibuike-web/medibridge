import type { ReactNode } from "react";
import Sidebar from "./sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<main className="flex h-screen">
			<Sidebar />
			<div className="flex flex-col flex-1 overflow-auto">{children}</div>
		</main>
	);
}
