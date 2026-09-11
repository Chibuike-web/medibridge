"use client";

import { useId, useRef, useState } from "react";
import { RiArrowRightSLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

import { InviteMembersSettings } from "./invite-members-settings";
import { ReviewInvitationsSettings } from "./review-invitations-settings";
import { SettingsBadge, type SettingsBadgeTone } from "./settings-badge";
import type {
	InviteMemberRow,
	MemberManagerRole,
	OrganizationRole,
	PendingInvitation,
	SettingsDialogUser,
	SettingsSubView,
} from "./types";

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
	activeSettingsSubView: SettingsSubView | null;
	currentUser: SettingsDialogUser;
	onSettingsSubViewChange: (view: SettingsSubView | null) => void;
	pendingInvitations: PendingInvitation[];
	viewerRole: MemberManagerRole;
};

const badgeToneByRole = {
	owner: "premium",
	admin: "info",
	member: "neutral",
} satisfies Record<OrganizationRole, SettingsBadgeTone>;

const ownerPreviewMembers: OrganizationMember[] = [
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

const adminPreviewMembers: OrganizationMember[] = [
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

export function MembersSettings({
	activeSettingsSubView,
	currentUser,
	onSettingsSubViewChange,
	pendingInvitations,
	viewerRole,
}: MembersSettingsProps) {
	const inviteRowsId = useId();
	const nextInviteMemberNumberRef = useRef(4);
	const [inviteMemberRows, setInviteMemberRows] = useState<InviteMemberRow[]>([
		{ id: "invite-member-1", email: "", role: "" },
	]);

	const handleAddInvitationRow = () => {
		const memberId = `${inviteRowsId}-member-${nextInviteMemberNumberRef.current++}`;
		setInviteMemberRows((prev) => [...prev, { id: memberId, email: "", role: "" }]);
	};

	if (activeSettingsSubView === "invite-member") {
		return (
			<InviteMembersSettings
				inviteMemberRows={inviteMemberRows}
				setInviteMemberRows={setInviteMemberRows}
				onAddInvitationRow={handleAddInvitationRow}
				onSettingsSubViewChange={onSettingsSubViewChange}
				viewerRole={viewerRole}
			/>
		);
	}

	if (activeSettingsSubView === "review-invitations") {
		return (
			<ReviewInvitationsSettings
				inviteMemberRows={inviteMemberRows}
				onCancel={() => onSettingsSubViewChange(null)}
			/>
		);
	}

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
			? [currentMember, ...ownerPreviewMembers]
			: [adminPreviewMembers[0], currentMember, ...adminPreviewMembers.slice(1)];

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
				{members.map((member) => (
					<MemberCard key={member.id} member={member} viewerRole={viewerRole} />
				))}
				{pendingInvitations.map((pendingInvitation) => (
					<PendingInvitationCard
						key={pendingInvitation.id}
						pendingInvitation={pendingInvitation}
						viewerRole={viewerRole}
					/>
				))}
			</div>
			<div className="flex shrink-0 justify-end border-t p-5">
				<Button type="button" onClick={() => onSettingsSubViewChange("invite-member")}>
					Invite new member
				</Button>
			</div>
		</div>
	);
}

function MemberCard({
	member,
	viewerRole,
}: {
	member: OrganizationMember;
	viewerRole: MemberManagerRole;
}) {
	const ownerCanManageMember =
		viewerRole === "owner" && (member.role === "admin" || member.role === "member");

	const adminCanManageMember = viewerRole === "admin" && member.role === "member";

	const canManageMember = !member.isCurrentUser && (ownerCanManageMember || adminCanManageMember);

	const [isMemberDetailsExpanded, setIsMemberDetailsExpanded] = useState(canManageMember);
	const memberDetailsId = useId();

	const memberSummary = (
		<>
			<div className="flex items-center justify-between gap-4">
				<p className="truncate text-base font-semibold">{member.name}</p>
				<SettingsBadge
					tone={badgeToneByRole[member.role]}
					muted={!canManageMember}
					className="capitalize"
				>
					{member.role}
				</SettingsBadge>
			</div>
			<div className="mt-3 flex items-center justify-between gap-4">
				<p className="min-w-0 truncate text-sm font-medium">{member.email}</p>
				{member.isCurrentUser ? (
					<span className="shrink-0 text-sm font-medium">You</span>
				) : canManageMember ? (
					<span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-gray-400">
						{isMemberDetailsExpanded ? "View less" : "View more"}
						<RiArrowRightSLine
							className={cn(
								"size-5 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
								isMemberDetailsExpanded ? "rotate-90" : "group-hover/member-card:translate-x-0.5",
							)}
							aria-hidden="true"
						/>
					</span>
				) : null}
			</div>
		</>
	);

	return (
		<article
			className={cn(
				"group/member-card shrink-0 rounded-2xl border",
				canManageMember
					? cn(
							"transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
							isMemberDetailsExpanded ? "border-gray-400" : "border-gray-200 hover:border-gray-400",
						)
					: "border-gray-200",
			)}
		>
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
				<div className={cn("p-4 text-gray-400", member.isCurrentUser && "opacity-50")}>
					{memberSummary}
				</div>
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
							<div className="flex justify-end gap-2 pt-5">
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

function PendingInvitationCard({
	pendingInvitation,
	viewerRole,
}: {
	pendingInvitation: PendingInvitation;
	viewerRole: MemberManagerRole;
}) {
	const canManageAdminInvitation = viewerRole === "owner" && pendingInvitation.role === "admin";

	const canManageMemberInvitation = pendingInvitation.role === "member";

	const canManageInvitation = canManageAdminInvitation || canManageMemberInvitation;

	const [isInvitationDetailsExpanded, setIsInvitationDetailsExpanded] =
		useState(canManageInvitation);
	const invitationDetailsId = useId();
	const invitationStatusTone = pendingInvitation.status === "pending" ? "warning" : "danger";
	const invitationSummary = (
		<>
			<div className="flex items-center justify-between gap-4">
				<p className="truncate text-base font-semibold">
					{pendingInvitation.name ?? pendingInvitation.email}
				</p>
				<SettingsBadge
					tone={invitationStatusTone}
					muted={!canManageInvitation}
					className="capitalize"
				>
					{pendingInvitation.status}
				</SettingsBadge>
			</div>
			<div className="mt-3 flex items-center justify-between gap-4">
				{pendingInvitation.name ? (
					<p className="min-w-0 truncate text-sm font-medium">{pendingInvitation.email}</p>
				) : (
					<span aria-hidden="true" />
				)}
				{canManageInvitation ? (
					<span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-gray-400">
						{isInvitationDetailsExpanded ? "View less" : "View more"}
						<RiArrowRightSLine
							className={cn(
								"size-5 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
								isInvitationDetailsExpanded
									? "rotate-90"
									: "group-hover/pending-invitation-card:translate-x-0.5",
							)}
							aria-hidden="true"
						/>
					</span>
				) : null}
			</div>
		</>
	);

	return (
		<article
			className={cn(
				"group/pending-invitation-card shrink-0 rounded-2xl border",
				canManageInvitation
					? cn(
							"transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
							isInvitationDetailsExpanded
								? "border-gray-400"
								: "border-gray-200 hover:border-gray-400",
						)
					: "border-gray-200",
			)}
		>
			{canManageInvitation ? (
				<button
					type="button"
					className="block w-full rounded-2xl border border-transparent p-4 text-left text-gray-600 focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100"
					aria-expanded={isInvitationDetailsExpanded}
					aria-controls={invitationDetailsId}
					onClick={() => setIsInvitationDetailsExpanded((prev) => !prev)}
				>
					{invitationSummary}
				</button>
			) : (
				<div className="p-4 text-gray-400">{invitationSummary}</div>
			)}

			{canManageInvitation ? (
				<div
					id={invitationDetailsId}
					className={cn(
						"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
						isInvitationDetailsExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
					)}
					aria-hidden={!isInvitationDetailsExpanded}
					inert={!isInvitationDetailsExpanded}
				>
					<div className="min-h-0 overflow-hidden">
						<div className="px-4 pb-4">
							<dl className="flex flex-col gap-3 text-sm">
								<div className="flex items-center justify-between gap-4">
									<dt className="text-gray-400">Role</dt>
									<dd className="font-semibold text-gray-600 capitalize">
										{pendingInvitation.role}
									</dd>
								</div>
								<div className="flex items-center justify-between gap-4">
									<dt className="text-gray-400">Invitation sent</dt>
									<dd className="font-semibold text-gray-600">{pendingInvitation.sentAt}</dd>
								</div>
								<div className="flex items-center justify-between gap-4">
									<dt className="text-gray-400">Expires</dt>
									<dd className="font-semibold text-gray-600">{pendingInvitation.expiresAt}</dd>
								</div>
							</dl>
							<div className="flex justify-end gap-2 pt-5">
								<Button type="button" variant="outline">
									Resend invitation
								</Button>
								<Button
									type="button"
									variant="destructive"
									className="border border-destructive bg-transparent text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:bg-transparent dark:hover:bg-destructive/10 dark:focus-visible:ring-destructive/40"
								>
									Cancel invitation
								</Button>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</article>
	);
}
