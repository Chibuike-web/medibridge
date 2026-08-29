"use client";

import { useId, useState } from "react";
import { RiArrowRightSLine } from "@remixicon/react";

import type { SettingsDialogUser } from "@/components/layout/settings/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type OrganizationRole = "owner" | "admin" | "member";
type ManageableOrganizationRole = Exclude<OrganizationRole, "member">;

type OrganizationMember = {
	id: string;
	name: string;
	email: string;
	role: OrganizationRole;
	joinedAt: string;
	lastActiveAt: string;
	isCurrentUser?: boolean;
};

type MembersSettingsProps = {
	currentUser: SettingsDialogUser;
	viewerRole: ManageableOrganizationRole;
};

const ownerViewMembers: OrganizationMember[] = [
	{
		id: "sarah-williams",
		name: "Sarah Williams",
		email: "sarah@example.com",
		role: "admin",
		joinedAt: "Aug 12, 2026",
		lastActiveAt: "Aug 24, 2026",
	},
	{
		id: "david-okafor",
		name: "David Okafor",
		email: "david@example.com",
		role: "member",
		joinedAt: "Aug 15, 2026",
		lastActiveAt: "Aug 24, 2026",
	},
];

const adminViewMembers: OrganizationMember[] = [
	{
		id: "john-doe",
		name: "John Doe",
		email: "john@example.com",
		role: "owner",
		joinedAt: "Aug 10, 2026",
		lastActiveAt: "Aug 24, 2026",
	},
	{
		id: "michael-chen",
		name: "Michael Chen",
		email: "michael@example.com",
		role: "admin",
		joinedAt: "Aug 13, 2026",
		lastActiveAt: "Aug 23, 2026",
	},
	{
		id: "david-okafor",
		name: "David Okafor",
		email: "david@example.com",
		role: "member",
		joinedAt: "Aug 15, 2026",
		lastActiveAt: "Aug 24, 2026",
	},
];

export function MembersSettings({ currentUser, viewerRole }: MembersSettingsProps) {
	const currentMember: OrganizationMember = {
		id: "current-user",
		name: currentUser.name,
		email: currentUser.email,
		role: viewerRole,
		joinedAt: "Aug 12, 2026",
		lastActiveAt: "Aug 24, 2026",
		isCurrentUser: true,
	};
	const members =
		viewerRole === "owner"
			? [currentMember, ...ownerViewMembers]
			: [adminViewMembers[0], currentMember, ...adminViewMembers.slice(1)];

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
				{members.map((member) => (
					<MemberCard key={member.id} member={member} viewerRole={viewerRole} />
				))}
			</div>
			<div className="flex shrink-0 justify-end border-t p-5">
				<Button type="button">Invite new member</Button>
			</div>
		</div>
	);
}

function MemberCard({
	member,
	viewerRole,
}: {
	member: OrganizationMember;
	viewerRole: ManageableOrganizationRole;
}) {
	const canManageMember =
		!member.isCurrentUser &&
		member.role !== "owner" &&
		(viewerRole === "owner" || member.role === "member");
	const [isMemberDetailsExpanded, setIsMemberDetailsExpanded] = useState(canManageMember);
	const memberDetailsId = useId();
	const memberSummary = (
		<>
			<div className="flex items-center justify-between gap-4">
				<p className="truncate text-base font-semibold">{member.name}</p>
				<span
					className={cn(
						"shrink-0 rounded-md px-2 py-1 text-sm font-semibold capitalize",
						canManageMember ? "bg-blue-100 text-blue-700" : "bg-blue-50 text-blue-400",
					)}
				>
					{member.role}
				</span>
			</div>
			<div className="mt-3 flex items-center justify-between gap-4">
				<p className="min-w-0 truncate text-sm font-medium">{member.email}</p>
				{member.isCurrentUser ? (
					<span className="shrink-0 text-sm font-medium">You</span>
				) : canManageMember ? (
					<span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-gray-400">
						{isMemberDetailsExpanded ? "View less" : "View more"}
						<RiArrowRightSLine
							className={cn(
								"size-5 transition-transform duration-200 ease-out motion-reduce:transition-none",
								isMemberDetailsExpanded && "rotate-90",
							)}
							aria-hidden="true"
						/>
					</span>
				) : null}
			</div>
		</>
	);

	return (
		<article className="shrink-0 rounded-2xl border border-gray-200">
			{canManageMember ? (
				<button
					type="button"
					className={cn(
						"block w-full rounded-2xl border border-transparent text-left text-gray-600 focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100",
						"p-4",
					)}
					aria-expanded={isMemberDetailsExpanded}
					aria-controls={memberDetailsId}
					onClick={() => setIsMemberDetailsExpanded((prev) => !prev)}
				>
					{memberSummary}
				</button>
			) : (
				<div className="p-4 text-gray-400">{memberSummary}</div>
			)}

			{canManageMember ? (
				<div
					id={memberDetailsId}
					className={cn(
						"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
						isMemberDetailsExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
					)}
					aria-hidden={!isMemberDetailsExpanded}
					inert={!isMemberDetailsExpanded}
				>
					<div className="min-h-0 overflow-hidden">
						<div className="px-4 pb-4">
							<dl className="flex flex-col gap-3 text-sm">
								<div className="flex items-center justify-between gap-4">
									<dt className="text-gray-400">Joined</dt>
									<dd className="font-semibold text-gray-600">{member.joinedAt}</dd>
								</div>
								<div className="flex items-center justify-between gap-4">
									<dt className="text-gray-400">Last active</dt>
									<dd className="font-semibold text-gray-600">{member.lastActiveAt}</dd>
								</div>
							</dl>
							<div className="flex justify-end gap-3 pt-5">
								<Button type="button" variant="outline">
									Change role
								</Button>
								<Button
									type="button"
									variant="destructive"
									className="border border-destructive bg-transparent text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:bg-transparent dark:hover:bg-destructive/10 dark:focus-visible:ring-destructive/40"
								>
									Remove member
								</Button>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</article>
	);
}
