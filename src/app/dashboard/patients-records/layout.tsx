import { DashboardLayout } from "@/components/dashboard-layout";
import { ReactNode } from "react";

export default function PatientsRecordsLayout({ children }: { children: ReactNode }) {
	return <DashboardLayout>{children}</DashboardLayout>;
}
