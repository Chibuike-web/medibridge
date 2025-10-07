import DashboardLayout from "@/components/dashboard-layout";
import TransfersClient from "./transfers-client";

export default function Transfers() {
	return (
		<DashboardLayout>
			<TransfersClient />
		</DashboardLayout>
	);
}
