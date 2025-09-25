import Sidebar from "./sidebar";
import Topbar from "./topbar";

export default async function DashboardLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: { slug: string };
}) {
	const { slug } = await params;
	return (
		<main className="flex h-screen">
			<Sidebar activeId={slug} />
			<div className="flex-1 flex flex-col h-full overflow-auto">
				<Topbar />
				<>{children}</>
			</div>
		</main>
	);
}
