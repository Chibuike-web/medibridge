import Sidebar from "./sidebar";
import Topbar from "./topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<main className="flex h-screen">
			<Sidebar />
			<div className="flex-1 flex flex-col h-full overflow-auto">
				<Topbar />
				<div className="bg-blue-500 w-full mx-auto max-w-[1440px] p-10">{children}</div>
			</div>
		</main>
	);
}
