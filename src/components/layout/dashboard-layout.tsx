import { Suspense, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { cookies } from "next/headers";

export async function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex h-dvh items-start">
			<Suspense fallback={<DashboardSidebarFallback />}>
				<DashboardSidebar />
			</Suspense>

			<div className="flex h-full flex-1 flex-col overflow-x-auto overflow-y-hidden">
				{children}
			</div>
		</div>
	);
}

async function DashboardSidebar() {
	const cookieStore = await cookies();
	const initialWidth = cookieStore.get("sidebarWidth")?.value;

	return <Sidebar initialWidth={initialWidth} />;
}

function DashboardSidebarFallback() {
	return (
		<aside className="h-dvh w-72 shrink-0 border-r border-border bg-background/95 px-3 py-4">
			<div className="mb-6 flex items-center gap-3 px-2">
				<div className="size-9 animate-pulse rounded-md bg-muted" />
				<div className="space-y-2">
					<div className="h-3 w-24 animate-pulse rounded bg-muted" />
					<div className="h-2.5 w-16 animate-pulse rounded bg-muted/70" />
				</div>
			</div>

			<div className="space-y-1">
				{Array.from({ length: 6 }).map((_, index) => (
					<div key={index} className="flex items-center gap-3 rounded-md px-2 py-2">
						<div className="size-4 animate-pulse rounded bg-muted" />
						<div className="h-3 flex-1 animate-pulse rounded bg-muted/80" />
					</div>
				))}
			</div>

			<div className="mt-auto pt-8">
				<div className="rounded-md border border-border p-3">
					<div className="mb-2 h-3 w-20 animate-pulse rounded bg-muted" />
					<div className="h-2.5 w-full animate-pulse rounded bg-muted/70" />
				</div>
			</div>
		</aside>
	);
}
