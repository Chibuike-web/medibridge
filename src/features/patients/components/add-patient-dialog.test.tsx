import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { Button } from "@/components/ui/button";
import { AddPatientDialog } from "./add-patient-dialog";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

const returnTo = "/dashboard/patients?page=2&query=Ada";

function renderDialog() {
	render(
		<AddPatientDialog returnTo={returnTo}>
			<Button>Add patient</Button>
		</AddPatientDialog>,
	);
}

test.each([
	{ option: /Enter manually/, pathname: "/dashboard/add-new-patient/manual" },
	{ option: /Bulk upload/, pathname: "/dashboard/add-new-patient/bulk" },
])(
	"continues to $pathname once chosen, returning to the page that opened the dialog",
	async ({ option, pathname }) => {
		const user = userEvent.setup();
		renderDialog();
		await user.click(screen.getByRole("button", { name: "Add patient" }));
		const dialog = within(screen.getByRole("dialog", { name: "Add patient" }));
		const continueButton = dialog.getByRole("button", { name: "Continue" });
		expect(continueButton).toBeDisabled();

		await user.click(dialog.getByRole("radio", { name: option }));
		expect(dialog.getByRole("radio", { name: option })).toBeChecked();
		await user.click(continueButton);

		const destination = new URL(pushMock.mock.calls[0][0], "http://localhost");
		expect(destination.pathname).toBe(pathname);
		expect(destination.searchParams.get("returnTo")).toBe(returnTo);
		expect(screen.queryByRole("dialog", { name: "Add patient" })).not.toBeInTheDocument();
	},
);

test("can be completed from the keyboard and closed with Escape", async () => {
	const user = userEvent.setup();
	renderDialog();
	const trigger = screen.getByRole("button", { name: "Add patient" });
	trigger.focus();
	await user.keyboard("{Enter}");
	const dialog = within(screen.getByRole("dialog", { name: "Add patient" }));
	expect(dialog.getByRole("button", { name: "Close add patient dialog" })).toHaveFocus();

	await user.tab();
	expect(dialog.getByRole("radio", { name: /Enter manually/ })).toHaveFocus();
	await user.keyboard("{ArrowDown}");
	expect(dialog.getByRole("radio", { name: /Bulk upload/ })).toHaveFocus();
	await user.keyboard(" ");
	expect(dialog.getByRole("radio", { name: /Bulk upload/ })).toBeChecked();
	await user.tab();
	await user.tab();
	expect(dialog.getByRole("button", { name: "Continue" })).toHaveFocus();
	await user.keyboard("{Escape}");

	expect(screen.queryByRole("dialog", { name: "Add patient" })).not.toBeInTheDocument();
	expect(trigger).toHaveFocus();
	expect(pushMock).not.toHaveBeenCalled();
});

test("cancelling goes nowhere and clears the choice for next time", async () => {
	const user = userEvent.setup();
	renderDialog();
	await user.click(screen.getByRole("button", { name: "Add patient" }));
	await user.click(screen.getByRole("radio", { name: /Bulk upload/ }));
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(screen.queryByRole("dialog", { name: "Add patient" })).not.toBeInTheDocument();
	expect(pushMock).not.toHaveBeenCalled();

	await user.click(screen.getByRole("button", { name: "Add patient" }));
	expect(screen.getByRole("radio", { name: /Bulk upload/ })).not.toBeChecked();
	expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
});

test("can be opened by a parent without its own trigger", () => {
	render(<AddPatientDialog returnTo={returnTo} open onOpenChange={() => {}} />);
	expect(
		within(screen.getByRole("dialog", { name: "Add patient" })).getByRole("radio", {
			name: /Enter manually/,
		}),
	).toBeVisible();
});
