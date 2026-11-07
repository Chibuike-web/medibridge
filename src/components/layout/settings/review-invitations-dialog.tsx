"use client";

import { useState } from "react";
import { RiArrowRightSLine, RiCloseLine } from "@remixicon/react";

import { SuccessModal } from "@/components/success-modal";
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

import type { InviteMemberRow } from "./types";

const MAX_VISIBLE_INVITATIONS = 3;

export function ReviewInvitationsDialog({
	open,
	onOpenChange,
	inviteMemberRows,
	organizationName,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	inviteMemberRows: InviteMemberRow[];
	organizationName: string;
}) {
	const [areAllInvitationsVisible, setAreAllInvitationsVisible] = useState(false);
	const [isInvitationSuccessModalOpen, setIsInvitationSuccessModalOpen] = useState(false);
	const invitationsToRender = areAllInvitationsVisible
		? inviteMemberRows
		: inviteMemberRows.slice(0, MAX_VISIBLE_INVITATIONS);

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-[37.5rem] gap-0 p-0">
					<DialogHeader className="py-4">
						<DialogTitle>Review invitations</DialogTitle>
						<DialogClose asChild>
							<Button variant="ghost" size="icon" aria-label="Close review invitations dialog">
								<RiCloseLine aria-hidden="true" />
							</Button>
						</DialogClose>
					</DialogHeader>
					<div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4 py-5">
						{invitationsToRender.map((memberRow) => (
							<div
								key={memberRow.id}
								className="flex items-center justify-between gap-6 text-sm font-semibold text-gray-600"
							>
								<span className="min-w-0 truncate">{memberRow.email}</span>
								<span className="shrink-0 capitalize">{memberRow.role}</span>
							</div>
						))}
						{inviteMemberRows.length > MAX_VISIBLE_INVITATIONS ? (
							<Button
								variant="ghost"
								type="button"
								className="h-auto w-fit gap-1 p-0 text-gray-400 hover:bg-transparent hover:text-gray-600 has-[>svg:last-child]:pr-0"
								onClick={() => setAreAllInvitationsVisible((prev) => !prev)}
							>
								{areAllInvitationsVisible
									? "View less"
									: `View all ${inviteMemberRows.length} invitations`}
								<RiArrowRightSLine aria-hidden="true" />
							</Button>
						) : null}
						<DialogDescription className="text-sm font-normal text-gray-400 text-pretty">
							Each person will receive an email invitation to join {organizationName} with their
							selected access.
						</DialogDescription>
					</div>
					<DialogFooter className="sm:justify-end">
						<Button
							type="button"
							onClick={() => {
								onOpenChange(false);
								setIsInvitationSuccessModalOpen(true);
							}}
						>
							Send {inviteMemberRows.length} invitation
							{inviteMemberRows.length === 1 ? "" : "s"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			{isInvitationSuccessModalOpen ? (
				<SuccessModal
					isOpen={isInvitationSuccessModalOpen}
					setIsOpen={setIsInvitationSuccessModalOpen}
					heading="Invitation sent"
					description={`An invitation link has been sent to the email addresses provided. They can use the link in the email to join ${organizationName}.`}
				>
					<DialogFooter>
						<DialogClose asChild>
							<Button className="flex-1">Done</Button>
						</DialogClose>
					</DialogFooter>
				</SuccessModal>
			) : null}
		</>
	);
}
