import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<main className="flex h-dvh">
			<Sidebar />
			<div className="flex flex-col flex-1 overflow-auto h-full">{children}</div>
		</main>
	);
}
