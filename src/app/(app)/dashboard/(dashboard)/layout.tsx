import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReactNode } from "react";
import { DashboardAuth } from "@/components/layout/dashboard-auth";

export default function DashboardRootLayout({ children }: { children: ReactNode }) {
	return (
		<DashboardAuth>
			<DashboardLayout>{children}</DashboardLayout>
		</DashboardAuth>
	);
}
