"use client";

import { cn } from "@/lib/utils/cn";

export function MembersSettings() {
	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between rounded-xl border p-4">
				<div>
					<p className="font-medium">Hospital team</p>
					<p className="text-sm text-foreground/60">Manage members and their roles.</p>
				</div>
				<button
					type="button"
					className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
				>
					Invite member
				</button>
			</div>
			<SettingsRow label="Members" value="View and manage team access" />
			<SettingsRow label="Roles" value="Owner, admin, and member permissions" />
		</div>
	);
}

function SettingsRow({
	label,
	value,
	showBorder = true,
}: {
	label: string;
	value: string;
	showBorder?: boolean;
}) {
	return (
		<div className={cn("flex h-16 items-center justify-between gap-4", showBorder && "border-b")}>
			<span className="text-sm text-foreground/70">{label}</span>
			<span className="text-right text-sm font-medium">{value}</span>
		</div>
	);
}
