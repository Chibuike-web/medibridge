"use client";

import { RiArrowRightSLine } from "@remixicon/react";
import { useState } from "react";
import { SuccessModal } from "@/components/success-modal";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { useShowSuccess } from "@/hooks/use-show-success";
import type { InviteMemberRow } from "./types";

const MAX_VISIBLE_INVITATIONS = 5;

export function ReviewInvitationsSettings({
	inviteMemberRows,
	onCancel,
}: {
	inviteMemberRows: InviteMemberRow[];
	onCancel: () => void;
}) {
	const {
		isSuccessModalOpen: isInvitationSuccessModalOpen,
		setIsSuccessModalOpen: setIsInvitationSuccessModalOpen,
	} = useShowSuccess();
	const [areAllInvitationsVisible, setAreAllInvitationsVisible] = useState(false);
	const handleConfirmInvitations = () => setIsInvitationSuccessModalOpen(true);
	const invitationsToRender = areAllInvitationsVisible
		? inviteMemberRows
		: inviteMemberRows.slice(0, MAX_VISIBLE_INVITATIONS);
	return (
		<>
			<div className="flex h-full min-h-0 flex-col">
				<div className="flex-1 overflow-y-auto px-6 py-6">
					<div className="flex flex-col gap-4">
						{invitationsToRender.map((memberRow) => (
							<div
								key={memberRow.id}
								className="flex items-center justify-between gap-6 text-sm font-semibold text-gray-600"
							>
								<span className="min-w-0 truncate">{memberRow.email}</span>
								<span className="shrink-0 capitalize">{memberRow.role}</span>
							</div>
						))}
						{inviteMemberRows.length > MAX_VISIBLE_INVITATIONS && (
							<button
								type="button"
								className="inline-flex w-fit items-center gap-1 rounded-md border border-transparent text-sm font-medium text-gray-400 transition-colors hover:text-gray-600 focus-visible:border-gray-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-gray-100"
								onClick={() => setAreAllInvitationsVisible((prev) => !prev)}
							>
								{areAllInvitationsVisible
									? "View less"
									: `View all ${inviteMemberRows.length} invitations`}
								<RiArrowRightSLine className="size-5" aria-hidden="true" />
							</button>
						)}
						<p className="max-w-3xl text-sm leading-6 text-gray-400">
							Each person will receive an email invitation to join Medicare General Hospital with
							their selected access.
						</p>
					</div>
				</div>
				<div className="flex shrink-0 justify-end gap-2 border-t p-5">
					<Button type="button" onClick={handleConfirmInvitations}>
						Send {inviteMemberRows.length} invitation
						{inviteMemberRows.length === 1 ? "" : "s"}
					</Button>
				</div>
			</div>
			{isInvitationSuccessModalOpen ? (
				<SuccessModal
					isOpen={isInvitationSuccessModalOpen}
					setIsOpen={setIsInvitationSuccessModalOpen}
					heading="Invitation sent"
					description="An invitation link has been sent to the email addresses provided. They can use the link in the email to join Medicare General Hospital."
				>
					<DialogFooter>
						<DialogClose asChild>
							<Button className="flex-1" onClick={onCancel}>
								Done
							</Button>
						</DialogClose>
					</DialogFooter>
				</SuccessModal>
			) : null}
		</>
	);
}
