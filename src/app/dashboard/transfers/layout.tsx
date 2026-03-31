import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReactNode } from "react";

export default function TransfersLayout({ children }: { children: ReactNode }) {
	return <DashboardLayout>{children}</DashboardLayout>;
}
