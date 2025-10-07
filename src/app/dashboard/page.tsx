import DashboardLayout from "@/components/dashboard-layout";
import DashboardClient from "./dashboard-client";

export default async function Dashboard() {
	return (
		<DashboardLayout>
			<DashboardClient />
		</DashboardLayout>
	);
}
