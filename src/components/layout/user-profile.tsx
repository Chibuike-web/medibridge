"use client";

import { cn } from "@/lib/utils/cn";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SettingsBadge, type SettingsBadgeTone } from "@/components/layout/settings/settings-badge";
import { SettingsDialog } from "@/components/layout/settings-dialog";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { authClient } from "@/lib/better-auth/auth.client";
import {
	RiCheckLine,
	RiContrast2Line,
	RiExpandUpDownLine,
	RiLoaderLine,
	RiLogoutBoxLine,
	RiSettingsLine,
} from "@remixicon/react";

const themeOptions = [
	{ label: "System", value: "system" },
	{ label: "Dark", value: "dark" },
	{ label: "Light", value: "light" },
];

const badgeToneByRole: Record<string, SettingsBadgeTone> = {
	owner: "premium",
	admin: "info",
	member: "neutral",
};

export function UserProfile({ isCollapsed }: { isCollapsed: boolean }) {
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [selectedTheme, setSelectedTheme] = useState("system");

	const router = useRouter();
	const { data: session, isPending: isLoadingUserSession } = authClient.useSession();
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const user = session?.user;
	const [isPending, startTransition] = useTransition();
	const [signOutError, setSignOutError] = useState("");
	// The session can already be cached on the client, so keep the server's skeleton until hydration.
	const isHydrated = useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);

	if (!isHydrated || isLoadingUserSession) {
		return <UserProfileSkeleton isCollapsed={isCollapsed} />;
	}

	if (!user) {
		return null;
	}

	const initials = user.name
		.split(" ")
		.map((namePart) => namePart.charAt(0).toUpperCase())
		.join("");

	return (
		<div className="w-full mt-auto p-2 flex flex-col items-center justify-center">
			<DropdownMenu>
				<DropdownMenuTrigger
					className={cn(
						"flex w-full min-w-0 items-center rounded-lg border border-transparent p-1.5 focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100",
						isCollapsed
							? "justify-center"
							: "gap-2 cursor-pointer overflow-hidden hover:bg-gray-100 data-[state=open]:bg-gray-100",
					)}
				>
					<Avatar className="size-6">
						<AvatarImage src={user.image ?? undefined} alt={`${user.name} profile image`} />
						<AvatarFallback className="text-xs">{initials}</AvatarFallback>
					</Avatar>

					{!isCollapsed ? (
						<>
							<span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
								{user.name}
							</span>
							<RiExpandUpDownLine className="size-4 shrink-0" />
						</>
					) : null}
				</DropdownMenuTrigger>
				<DropdownMenuContent
					className={cn(
						"rounded-xl bg-white text-sm text-gray-700",
						isCollapsed ? "w-[15.9375rem]" : "w-(--radix-dropdown-menu-trigger-width)",
					)}
					side={isCollapsed ? "right" : "top"}
					align="end"
					sideOffset={isCollapsed ? 8 : 4}
				>
					<DropdownMenuLabel className="flex items-center justify-between gap-2 px-2 py-1.5 font-normal">
						<span className="min-w-0 truncate text-sm text-gray-600">{user.email}</span>
						{activeMemberRole?.role ? (
							<SettingsBadge
								tone={badgeToneByRole[activeMemberRole.role] ?? "neutral"}
								className="rounded-full capitalize"
							>
								{activeMemberRole.role}
							</SettingsBadge>
						) : null}
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="rounded-lg text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
							<RiContrast2Line />
							<span className="flex-1">Theme</span>
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="w-48 rounded-xl bg-white text-sm text-gray-700">
							{themeOptions.map((themeOption) => (
								<DropdownMenuItem
									key={themeOption.value}
									onSelect={(event) => {
										event.preventDefault();
										setSelectedTheme(themeOption.value);
									}}
									className="rounded-lg text-gray-600 focus:bg-gray-100 focus:text-gray-900"
								>
									<span className="flex-1">{themeOption.label}</span>
									{selectedTheme === themeOption.value ? (
										<RiCheckLine className="size-4" aria-label="Selected" />
									) : null}
								</DropdownMenuItem>
							))}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					<DropdownMenuItem
						onSelect={() => setIsSettingsOpen(true)}
						className="rounded-lg text-gray-600 focus:bg-gray-100 focus:text-gray-900"
					>
						<RiSettingsLine />
						Settings
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant="destructive"
						disabled={isPending}
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
						className="rounded-lg"
					>
						<RiLogoutBoxLine />
						Sign out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			{signOutError && (
				<p role="alert" className="mt-2 text-sm text-red-600">
					{signOutError}
				</p>
			)}

			{isPending && (
				<div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm grid place-items-center">
					<div className="flex flex-col gap-2 items-center">
						<RiLoaderLine className="size-6 animate-spin" />
						<span className="text-sm">Signing out...</span>
					</div>
				</div>
			)}
			<SettingsDialog user={user} open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
		</div>
	);
}

function UserProfileSkeleton({ isCollapsed }: { isCollapsed: boolean }) {
	return (
		<div className="mt-auto flex w-full justify-center p-2" aria-hidden="true">
			<div
				className={cn(
					"flex w-full min-w-0 items-center rounded-lg p-1.5",
					isCollapsed ? "justify-center" : "gap-2",
				)}
			>
				<div className="size-6 shrink-0 animate-pulse rounded-full bg-gray-200" />
				{!isCollapsed ? <div className="h-3 w-28 animate-pulse rounded bg-gray-200" /> : null}
			</div>
		</div>
	);
}
