"use client";

import { SettingsBadge, type SettingsBadgeTone } from "@/components/layout/settings/settings-badge";
import { SettingsDialog } from "@/components/layout/settings-dialog";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { PixelLoader } from "@/components/ui/pixel-loader";
import type { Menu } from "@/components/layout/sidebar";
import { authClient } from "@/lib/better-auth/auth.client";
import { cn } from "@/lib/utils/cn";
import { RiCloseLine, RiLogoutBoxLine, RiMenuLine, RiSettingsLine } from "@remixicon/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const badgeToneByRole: Record<string, SettingsBadgeTone> = {
	owner: "premium",
	admin: "info",
	member: "neutral",
};

export function MobileMenu({ menus }: { menus: Menu[] }) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [signOutError, setSignOutError] = useState("");
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const pathname = usePathname();
	const { data: session } = authClient.useSession();
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const user = session?.user;

	return (
		<>
			<Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
				<DrawerTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						aria-label="Open menu"
						className="rounded-lg hover:bg-gray-100"
					>
						<RiMenuLine aria-hidden="true" />
					</Button>
				</DrawerTrigger>
				<DrawerContent className="max-w-none overflow-hidden border text-sm data-[vaul-drawer-direction=bottom]:inset-x-4 data-[vaul-drawer-direction=bottom]:bottom-4 data-[vaul-drawer-direction=bottom]:rounded-3xl">
					<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
						<DrawerTitle className="leading-[1.2] text-gray-800">Menu</DrawerTitle>
						<DrawerClose asChild>
							<Button variant="ghost" size="icon" aria-label="Close menu">
								<RiCloseLine aria-hidden="true" />
							</Button>
						</DrawerClose>
						<DrawerDescription className="sr-only">
							Go to another page, open settings, or sign out.
						</DrawerDescription>
					</DrawerHeader>
					<div className="flex flex-col gap-1 p-2">
						<nav aria-label="Primary" className="flex flex-col gap-1">
							{menus.map(({ id, href, label, icon: Icon, activeIcon: ActiveIcon }) => {
								const isActive = pathname.startsWith(href);

								return (
									<Link
										key={id}
										href={href}
										aria-current={isActive ? "page" : undefined}
										onClick={() => setIsMenuOpen(false)}
										className={cn(
											"flex h-9 items-center gap-2 rounded-lg px-2.5 font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100",
											isActive && "bg-gray-200 text-gray-800",
										)}
									>
										{isActive ? (
											<ActiveIcon className="size-4 shrink-0" />
										) : (
											<Icon className="size-4 shrink-0" />
										)}
										{label}
									</Link>
								);
							})}
						</nav>
						<div className="mx-2.5 my-1 h-px bg-gray-200" role="separator" />
						{user ? (
							<div className="flex flex-col gap-0.5 px-2.5 py-1.5">
								<span className="truncate font-medium text-gray-800">{user.name}</span>
								<div className="flex items-center justify-between gap-2">
									<span className="min-w-0 truncate text-gray-600">{user.email}</span>
									{activeMemberRole?.role ? (
										<SettingsBadge
											tone={badgeToneByRole[activeMemberRole.role] ?? "neutral"}
											className="rounded-full capitalize"
										>
											{activeMemberRole.role}
										</SettingsBadge>
									) : null}
								</div>
							</div>
						) : null}
						<Button
							variant="ghost"
							className="justify-start font-normal text-gray-600 hover:bg-gray-100"
							onClick={() => {
								setIsMenuOpen(false);
								setIsSettingsOpen(true);
							}}
						>
							<RiSettingsLine aria-hidden="true" />
							Settings
						</Button>
						<Button
							variant="ghost"
							disabled={isPending}
							className="justify-start font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
							onClick={() => {
								setSignOutError("");
								startTransition(async () => {
									try {
										const { error } = await authClient.signOut();
										if (error) {
											setSignOutError("Unable to sign out. Please try again.");
											return;
										}
										router.replace("/sign-in");
										router.refresh();
									} catch (error) {
										console.error(error);
										setSignOutError("Unable to sign out. Please try again.");
									}
								});
							}}
						>
							{isPending ? (
								<PixelLoader label="Signing out…" />
							) : (
								<>
									<RiLogoutBoxLine aria-hidden="true" />
									Sign out
								</>
							)}
						</Button>
						{signOutError ? (
							<p role="alert" className="px-2.5 text-sm text-red-600">
								{signOutError}
							</p>
						) : null}
					</div>
				</DrawerContent>
			</Drawer>
			{user ? (
				<SettingsDialog user={user} open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
			) : null}
		</>
	);
}
