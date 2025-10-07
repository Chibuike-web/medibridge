import Sidebar from "./sidebar";
import Topbar from "./topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<main className="flex h-screen">
			<Sidebar />
			<div className="flex flex-col flex-1 overflow-auto">
				<Topbar />
				<>{children}</>
			</div>
		</main>
	);
}
