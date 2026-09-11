import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { DeleteAccountDialog } from "./delete-account-dialog";

describe("DeleteAccountDialog", () => {
	test.each([false, true])(
		"blocks owner deletion even when transferred is %s",
		async (hasTransferredOwnership) => {
			const user = userEvent.setup();
			const onDeleteAccount = vi.fn();
			const onTransferOwnership = vi.fn();
			render(
				<DeleteAccountDialog
					open
					onOpenChange={vi.fn()}
					viewerRole="owner"
					organizationName="Test Hospital"
					hasTransferredOwnership={hasTransferredOwnership}
					onDeleteAccount={onDeleteAccount}
					onTransferOwnership={onTransferOwnership}
				/>,
			);
			expect(
				screen.getByRole("alertdialog", {
					name: "Transfer ownership before deleting your account",
				}),
			).toBeVisible();
			expect(screen.queryByRole("button", { name: "Delete account" })).not.toBeInTheDocument();
			await user.click(screen.getByRole("button", { name: "Transfer Ownership" }));
			expect(onTransferOwnership).toHaveBeenCalledOnce();
			expect(onDeleteAccount).not.toHaveBeenCalled();
		},
	);

	test.each([
		{
			viewerRole: "member" as const,
			hasTransferredOwnership: false,
			notice: /including patient records/,
		},
		{
			viewerRole: "admin" as const,
			hasTransferredOwnership: false,
			notice: /administrative access to Test Hospital/,
		},
		{
			viewerRole: "admin" as const,
			hasTransferredOwnership: true,
			notice: /Your ownership of Test Hospital has been transferred/,
		},
	])(
		"shows the correct warning for $viewerRole with transferred=$hasTransferredOwnership",
		async (props) => {
			const user = userEvent.setup();
			const onDeleteAccount = vi.fn();
			render(
				<DeleteAccountDialog
					open
					onOpenChange={vi.fn()}
					organizationName="Test Hospital"
					viewerRole={props.viewerRole}
					hasTransferredOwnership={props.hasTransferredOwnership}
					onDeleteAccount={onDeleteAccount}
				/>,
			);
			expect(screen.getByText(props.notice)).toBeVisible();
			expect(screen.getByText("This action cannot be undone.")).toBeVisible();
			expect(screen.queryByRole("button", { name: "Transfer Ownership" })).not.toBeInTheDocument();
			expect(onDeleteAccount).not.toHaveBeenCalled();
			await user.click(screen.getByRole("button", { name: "Delete account" }));
			expect(onDeleteAccount).toHaveBeenCalledOnce();
		},
	);

	test("Cancel closes the dialog without deleting", async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();
		const onDeleteAccount = vi.fn();
		render(
			<DeleteAccountDialog
				open
				onOpenChange={onOpenChange}
				viewerRole="member"
				organizationName="Test Hospital"
				onDeleteAccount={onDeleteAccount}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(onDeleteAccount).not.toHaveBeenCalled();
	});
});
