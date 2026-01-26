import { DashboardAuth } from "@/components/dashboard-auth";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
	return <DashboardAuth>{children}</DashboardAuth>;
}
