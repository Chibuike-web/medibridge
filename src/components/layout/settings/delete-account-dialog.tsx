"use client";

import { RiCloseLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { OrganizationRole } from "./types";

export function DeleteAccountDialog({
	open,
	onOpenChange,
	viewerRole,
	organizationName,
	hasTransferredOwnership = false,
	onDeleteAccount,
	onTransferOwnership,
	onContactSupport,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	viewerRole: OrganizationRole;
	organizationName: string;
	hasTransferredOwnership?: boolean;
	onDeleteAccount?: () => void;
	onTransferOwnership?: () => void;
	onContactSupport?: () => void;
}) {
	const mustTransferOwnership = viewerRole === "owner";
	const retentionNotice =
		"Your account will be permanently deleted. Information associated with your account may be retained where required for organizational, legal, or audit purposes.";
	const details = mustTransferOwnership
		? [
				`You are the owner of ${organizationName}. To delete your account, you must first transfer organization ownership to another member.`,
				"The new owner will have full control of the organization, including its members, settings, and billing.",
				"After ownership has been transferred, you can permanently delete your account.",
			]
		: hasTransferredOwnership
			? [
					`Your ownership of ${organizationName} has been transferred.`,
					`You will lose access to ${organizationName} and its data.`,
					retentionNotice,
					"The organization and its data will remain available to its new owner.",
					"You will be signed out of all devices.",
				]
			: viewerRole === "admin"
				? [
						retentionNotice,
						`You will lose your administrative access to ${organizationName}, including the ability to manage members and organization settings.`,
						`${organizationName} and its data will not be deleted. Its owner and other administrators will continue to have access.`,
						"You will be signed out of all devices.",
					]
				: [
						retentionNotice,
						`You will lose access to ${organizationName}, including patient records, encounters, and other features available to you.`,
						"You will be signed out of all devices.",
					];

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{mustTransferOwnership
							? "Transfer ownership before deleting your account"
							: "Are you sure you want to delete your account?"}
					</AlertDialogTitle>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						aria-label="Close delete account dialog"
						onClick={() => onOpenChange(false)}
					>
						<RiCloseLine className="size-5" aria-hidden="true" />
					</Button>
				</AlertDialogHeader>
				<div>
					<AlertDialogDescription asChild>
						<div>
							<ul className="list-disc pl-5">
								{details.map((detail) => (
									<li key={detail}>{detail}</li>
								))}
							</ul>
							{!mustTransferOwnership && (
								<p className="mt-4 pl-5 font-semibold text-gray-600">
									This action cannot be undone.
								</p>
							)}
						</div>
					</AlertDialogDescription>
				</div>
				<AlertDialogFooter>
					{mustTransferOwnership ? (
						<>
							<Button
								type="button"
								variant="outline"
								disabled={!onContactSupport}
								onClick={onContactSupport}
							>
								Contact Support
							</Button>
							<Button type="button" disabled={!onTransferOwnership} onClick={onTransferOwnership}>
								Transfer Ownership
							</Button>
						</>
					) : (
						<>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								variant="destructive"
								disabled={!onDeleteAccount}
								onClick={onDeleteAccount}
							>
								Delete account
							</AlertDialogAction>
						</>
					)}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
