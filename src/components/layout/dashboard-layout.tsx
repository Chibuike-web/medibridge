import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex items-start h-dvh">
			<Sidebar />
			<div className="flex flex-col flex-1 h-full overflow-x-auto">{children}</div>
		</div>
	);
}
