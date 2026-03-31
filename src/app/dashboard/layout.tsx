import { DashboardAuth } from "@/components/layout/dashboard-auth";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
	return <DashboardAuth>{children}</DashboardAuth>;
}
