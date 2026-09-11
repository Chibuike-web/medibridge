"use client";

import React, { useId, type Dispatch, type SetStateAction, type FormEvent } from "react";
import { RiAddLine, RiCloseLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import type { InviteMemberRow, MemberManagerRole, SettingsSubView } from "./types";

const fieldLabelClassName = "inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const requiredLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400";

const inviteRoleOptions = {
	owner: [
		{ label: "Admin", value: "admin" },
		{ label: "Member", value: "member" },
	],
	admin: [{ label: "Member", value: "member" }],
} satisfies Record<
	MemberManagerRole,
	{ label: string; value: Exclude<InviteMemberRow["role"], ""> }[]
>;

export function InviteMembersSettings({
	inviteMemberRows,
	setInviteMemberRows,
	onAddInvitationRow,
	onSettingsSubViewChange,
	viewerRole,
}: {
	inviteMemberRows: InviteMemberRow[];
	setInviteMemberRows: Dispatch<SetStateAction<InviteMemberRow[]>>;
	onAddInvitationRow: () => void;
	onSettingsSubViewChange: (view: SettingsSubView | null) => void;
	viewerRole: MemberManagerRole;
}) {
	const inviteFormId = useId();
	const handleEmailChange = (memberId: string, email: string) => {
		setInviteMemberRows((prev) =>
			prev.map((memberRow) => (memberRow.id === memberId ? { ...memberRow, email } : memberRow)),
		);
	};

	const handleRoleChange = (memberId: string, role: string) => {
		const isAllowedInviteRole = inviteRoleOptions[viewerRole].some(
			(roleOption) => roleOption.value === role,
		);

		if (!isAllowedInviteRole) {
			return;
		}

		setInviteMemberRows((prev) =>
			prev.map((memberRow) =>
				memberRow.id === memberId
					? { ...memberRow, role: role as Exclude<InviteMemberRow["role"], ""> }
					: memberRow,
			),
		);
	};

	const handleRemoveMember = (memberId: string) => {
		setInviteMemberRows((prev) =>
			prev.length === 1 ? prev : prev.filter((memberRow) => memberRow.id !== memberId),
		);
	};

	const handleSendInvitations = (event: React.ChangeEvent<HTMLFormElement>) => {
		event.preventDefault();
		onSettingsSubViewChange("review-invitations");
	};

	return (
		<div className="flex h-full min-h-0 flex-col">
			<form
				id={inviteFormId}
				className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6"
				onSubmit={handleSendInvitations}
			>
				<div className="flex flex-col gap-6">
					{inviteMemberRows.map((memberRow, memberIndex) => (
						<div
							key={memberRow.id}
							className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
						>
							<div className="flex items-center justify-between gap-4 sm:col-span-2">
								<span className="text-base font-semibold text-gray-800">
									Member {memberIndex + 1}
								</span>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									aria-label={`Remove member ${memberIndex + 1}`}
									className="size-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
									onClick={() => handleRemoveMember(memberRow.id)}
								>
									<RiCloseLine className="size-4" aria-hidden="true" />
								</Button>
							</div>

							<div className="flex flex-col gap-2">
								<Label
									htmlFor={`${inviteFormId}-${memberRow.id}-email`}
									className={fieldLabelClassName}
								>
									Email address<span className={requiredLabelClassName}>(required)</span>
								</Label>
								<Input
									id={`${inviteFormId}-${memberRow.id}-email`}
									type="email"
									value={memberRow.email}
									onChange={(event) => handleEmailChange(memberRow.id, event.target.value)}
									placeholder="Enter email"
									required
									className={fieldControlClassName}
								/>
							</div>

							<div className="flex flex-col gap-2">
								<Label
									htmlFor={`${inviteFormId}-${memberRow.id}-role`}
									className={fieldLabelClassName}
								>
									Role<span className={requiredLabelClassName}>(required)</span>
								</Label>
								<Select
									value={memberRow.role}
									onValueChange={(role) => handleRoleChange(memberRow.id, role)}
									required
								>
									<SelectTrigger
										id={`${inviteFormId}-${memberRow.id}-role`}
										className={`${fieldControlClassName} w-full data-[placeholder]:text-gray-400`}
									>
										<SelectValue placeholder="Select member role" />
									</SelectTrigger>
									<SelectContent align="start">
										{inviteRoleOptions[viewerRole].map((roleOption) => (
											<SelectItem key={roleOption.value} value={roleOption.value}>
												{roleOption.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					))}

					<div>
						<Button
							type="button"
							variant="outline"
							className="border-gray-200 bg-white text-gray-600"
							onClick={onAddInvitationRow}
						>
							<RiAddLine className="size-5" aria-hidden="true" />
							Add another member
						</Button>
					</div>
				</div>
			</form>

			<div className="flex shrink-0 justify-end gap-2 border-t p-5">
				<Button type="submit" form={inviteFormId}>
					Review invitations
				</Button>
			</div>
		</div>
	);
}
