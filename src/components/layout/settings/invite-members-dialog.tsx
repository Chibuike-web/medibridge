"use client";

import { useId, useState, type Dispatch, type SetStateAction } from "react";
import { RiAddLine, RiCloseLine, RiShieldCheckLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLabel } from "@/lib/utils/format-label";

import { ManageAccessDialog } from "./manage-access-dialog";
import type { InviteMemberRow } from "./types";

export function InviteMembersDialog({
	open,
	onOpenChange,
	inviteMemberRows,
	setInviteMemberRows,
	onContinue,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	inviteMemberRows: InviteMemberRow[];
	setInviteMemberRows: Dispatch<SetStateAction<InviteMemberRow[]>>;
	onContinue: () => void;
}) {
	const inviteFormId = useId();
	const [editingAccessRowId, setEditingAccessRowId] = useState<string | null>(null);
	const [rowIdsMissingAccess, setRowIdsMissingAccess] = useState<string[]>([]);
	const editingAccessRow = inviteMemberRows.find((row) => row.id === editingAccessRowId);

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-[37.5rem] gap-0 p-0">
					<DialogHeader className="py-4">
						<DialogTitle>Invite new members</DialogTitle>
						<DialogClose asChild>
							<Button variant="ghost" size="icon" aria-label="Close invite new members dialog">
								<RiCloseLine aria-hidden="true" />
							</Button>
						</DialogClose>
					</DialogHeader>
					<DialogDescription className="sr-only">
						Add an email address and access for each person you want to invite.
					</DialogDescription>
					<form
						method="post"
						id={inviteFormId}
						className="flex max-h-[60vh] flex-col gap-6 overflow-y-auto px-4 py-5"
						onSubmit={(event) => {
							event.preventDefault();
							const rowIdsWithoutAccess = inviteMemberRows
								.filter((row) => row.access === null)
								.map((row) => row.id);
							setRowIdsMissingAccess(rowIdsWithoutAccess);
							if (rowIdsWithoutAccess.length === 0) {
								onContinue();
							}
						}}
					>
						{inviteMemberRows.map((memberRow, memberIndex) => (
							<div
								key={memberRow.id}
								className="grid grid-cols-1 gap-x-2 gap-y-4 sm:grid-cols-[minmax(0,1fr)_auto]"
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
										disabled={inviteMemberRows.length === 1}
										onClick={() =>
											setInviteMemberRows((prev) => prev.filter(({ id }) => id !== memberRow.id))
										}
									>
										<RiCloseLine className="size-4" aria-hidden="true" />
									</Button>
								</div>

								<div className="flex flex-col gap-2">
									<Label
										htmlFor={`${inviteFormId}-${memberRow.id}-email`}
										className="text-sm font-medium text-gray-600"
									>
										Email address <span className="font-normal text-gray-400">(required)</span>
									</Label>
									<Input
										id={`${inviteFormId}-${memberRow.id}-email`}
										type="email"
										value={memberRow.email}
										onChange={(event) =>
											setInviteMemberRows((prev) =>
												prev.map((row) =>
													row.id === memberRow.id ? { ...row, email: event.target.value } : row,
												),
											)
										}
										placeholder="Enter email"
										required
									/>
								</div>

								<div className="flex flex-col gap-2">
									<span
										id={`${inviteFormId}-${memberRow.id}-access-label`}
										className="text-sm font-medium text-gray-600"
									>
										Access <span className="font-normal text-gray-400">(required)</span>
									</span>
									<Button
										id={`${inviteFormId}-${memberRow.id}-access`}
										type="button"
										variant="outline"
										aria-labelledby={`${inviteFormId}-${memberRow.id}-access-label ${inviteFormId}-${memberRow.id}-access`}
										aria-invalid={rowIdsMissingAccess.includes(memberRow.id)}
										aria-describedby={
											rowIdsMissingAccess.includes(memberRow.id)
												? `${inviteFormId}-${memberRow.id}-access-error`
												: undefined
										}
										className="w-41 justify-start font-normal text-gray-800 max-sm:w-full"
										onClick={() => setEditingAccessRowId(memberRow.id)}
									>
										<RiShieldCheckLine className="text-gray-600" aria-hidden="true" />
										{memberRow.access ? null : <span className="font-medium">Manage access</span>}
										{memberRow.access?.role === "admin" ? "Admin" : null}
										{memberRow.access?.role === "member" ? (
											<span>
												{formatLabel(memberRow.access.staffType ?? "member")}
												{memberRow.access.departments
													? ` +${memberRow.access.departments.length}`
													: null}
											</span>
										) : null}
									</Button>
									{rowIdsMissingAccess.includes(memberRow.id) ? (
										<p
											id={`${inviteFormId}-${memberRow.id}-access-error`}
											className="text-sm font-medium text-red-500"
										>
											Set access first.
										</p>
									) : null}
								</div>
							</div>
						))}

						<Button
							type="button"
							variant="outline"
							className="self-start bg-white text-gray-600"
							onClick={() =>
								setInviteMemberRows((prev) => [
									...prev,
									{ id: crypto.randomUUID(), email: "", access: null },
								])
							}
						>
							<RiAddLine aria-hidden="true" />
							Add another member
						</Button>
					</form>
					<DialogFooter className="sm:justify-end">
						<DialogClose asChild>
							<Button type="button" variant="outline">
								Cancel
							</Button>
						</DialogClose>
						<Button type="submit" form={inviteFormId}>
							Continue
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			{editingAccessRow ? (
				<ManageAccessDialog
					open
					onOpenChange={(isOpen) => setEditingAccessRowId(isOpen ? editingAccessRow.id : null)}
					memberLabel={
						editingAccessRow.email || `Member ${inviteMemberRows.indexOf(editingAccessRow) + 1}`
					}
					access={editingAccessRow.access}
					onSave={(access) => {
						setInviteMemberRows((prev) =>
							prev.map((row) => (row.id === editingAccessRow.id ? { ...row, access } : row)),
						);
						setRowIdsMissingAccess((prev) => prev.filter((id) => id !== editingAccessRow.id));
						setEditingAccessRowId(null);
					}}
				/>
			) : null}
		</>
	);
}
