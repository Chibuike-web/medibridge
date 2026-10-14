import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { ContactInformation } from "./contact-information";

const { updateContactMock } = vi.hoisted(() => ({ updateContactMock: vi.fn() }));
vi.mock("@/features/patients/server/update-patient-contact-information-action", () => ({
	updatePatientContactInformationAction: updateContactMock,
}));

const contactInformation = [
	{ label: "Phone number", value: "08011111111" },
	{ label: "Email address", value: "patient@example.com" },
	{ label: "Residential address", value: "12 Hospital Road" },
	{ label: "State of origin", value: "ENUGU State" },
	{ label: "Country of origin", value: "Nigeria" },
];

beforeEach(() => {
	updateContactMock.mockReset();
	updateContactMock.mockResolvedValue({ status: "success" });
});

test.each(["Cancel", "Close edit contact information dialog", "Escape"])(
	"discards picker changes when closed with %s and saves only the next edit",
	async (closeAction) => {
		const user = userEvent.setup();
		render(<ContactInformation patientId="patient-1" contactInformation={contactInformation} />);
		await user.click(screen.getByRole("button", { name: "Open actions for Contact Information" }));
		await user.click(screen.getByRole("menuitem", { name: "Edit info" }));
		let dialog = within(screen.getByRole("dialog", { name: "Edit Contact Information" }));
		await user.click(dialog.getByRole("combobox", { name: "State of origin" }));
		await user.click(screen.getByRole("option", { name: "Lagos" }));
		expect(dialog.getByRole("combobox", { name: "State of origin" })).toHaveTextContent("Lagos");
		if (closeAction === "Escape") await user.keyboard("{Escape}");
		else await user.click(dialog.getByRole("button", { name: closeAction }));
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		expect(updateContactMock).not.toHaveBeenCalled();

		await user.click(screen.getByRole("menuitem", { name: "Edit info" }));
		dialog = within(screen.getByRole("dialog", { name: "Edit Contact Information" }));
		expect(dialog.getByRole("combobox", { name: "State of origin" })).toHaveTextContent("Enugu");
		await user.clear(dialog.getByRole("textbox", { name: "Residential address" }));
		await user.type(
			dialog.getByRole("textbox", { name: "Residential address" }),
			"14 Hospital Road",
		);
		await user.click(dialog.getByRole("button", { name: "Save changes" }));
		await waitFor(() => expect(updateContactMock).toHaveBeenCalled());
		const [patientId, submittedContact] = updateContactMock.mock.calls[0];
		expect(patientId).toBe("patient-1");
		expect(submittedContact.get("stateOfOrigin")).toBe("Enugu");
		expect(submittedContact.get("countryOfOrigin")).toBe("Nigeria");
		expect(submittedContact.get("residentialAddress")).toBe("14 Hospital Road");
	},
);

test("submits the chosen state and uses the latest saved state when editing again", async () => {
	const user = userEvent.setup();
	const { rerender } = render(
		<ContactInformation patientId="patient-1" contactInformation={contactInformation} />,
	);
	await user.click(screen.getByRole("button", { name: "Open actions for Contact Information" }));
	await user.click(screen.getByRole("menuitem", { name: "Edit info" }));
	const dialog = within(screen.getByRole("dialog", { name: "Edit Contact Information" }));
	await user.click(dialog.getByRole("combobox", { name: "State of origin" }));
	await user.click(screen.getByRole("option", { name: "Lagos" }));
	await user.click(dialog.getByRole("button", { name: "Save changes" }));
	await waitFor(() => expect(updateContactMock).toHaveBeenCalled());
	expect(updateContactMock.mock.calls[0][1].get("stateOfOrigin")).toBe("Lagos");
	rerender(
		<ContactInformation
			patientId="patient-1"
			contactInformation={contactInformation.map((item) =>
				item.label === "State of origin" ? { ...item, value: "Abia" } : item,
			)}
		/>,
	);
	await user.click(screen.getByRole("menuitem", { name: "Edit info" }));
	expect(
		within(screen.getByRole("dialog")).getByRole("combobox", { name: "State of origin" }),
	).toHaveTextContent("Abia");
});
