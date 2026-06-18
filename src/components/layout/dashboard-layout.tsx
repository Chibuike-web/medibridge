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
		<aside className="flex h-full w-68 shrink-0 flex-col overflow-hidden border-r border-gray-200">
			<div className="relative flex h-16 items-center justify-between pl-5 pr-2">
				<div className="h-5 w-28 animate-pulse rounded bg-muted" />
				<div className="size-10 animate-pulse rounded-lg bg-muted/80" />
			</div>

			<ul className="flex flex-col gap-px p-2 text-sm">
				{Array.from({ length: 4 }).map((_, index) => (
					<li key={index}>
						<div className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5">
							<div className="size-5 shrink-0 animate-pulse rounded bg-muted" />
							<div className="h-3 w-24 animate-pulse rounded bg-muted/80" />
						</div>
					</li>
				))}
			</ul>

			<div className="mt-auto flex w-full justify-center p-2">
				<div className="flex w-full min-w-0 items-center gap-2 rounded-lg p-3">
					<div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
					<div className="flex min-w-0 flex-1 items-center justify-between gap-2">
						<div className="flex min-w-0 flex-1 flex-col gap-2">
							<div className="h-3 w-24 animate-pulse rounded bg-muted" />
							<div className="h-2.5 w-36 animate-pulse rounded bg-muted/70" />
						</div>
						<div className="size-5 shrink-0 animate-pulse rounded bg-muted/80" />
					</div>
				</div>
			</div>
		</aside>
	);
}
