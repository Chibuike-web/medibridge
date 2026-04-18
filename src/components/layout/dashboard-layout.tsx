import { type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { cookies } from "next/headers";

export async function DashboardLayout({ children }: { children: ReactNode }) {
	const cookieStore = await cookies();
	const stored = cookieStore.get("sidebarWidth")?.value;

	return (
		<div className="flex items-start h-dvh">
			<Sidebar initialWidth={stored} />
			<div className="flex flex-col flex-1 h-full overflow-x-auto">{children}</div>
		</div>
	);
}
