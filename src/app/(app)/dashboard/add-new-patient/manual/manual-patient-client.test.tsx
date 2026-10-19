import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { ManualPatientClient } from "./manual-patient-client";

const { createPatientMock, pushMock, refreshMock } = vi.hoisted(() => ({
	createPatientMock: vi.fn(),
	pushMock: vi.fn(),
	refreshMock: vi.fn(),
}));

vi.mock("@/features/patients/server/create-patient-action", () => ({
	createPatientAction: createPatientMock,
}));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const section = (name: RegExp) => within(screen.getByRole("region", { name }));

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
	const personal = section(/Personal Information/);
	const emergency = section(/Emergency Contact/);
	for (const [fields, label, value] of [
		[personal, /^First name/, "Ada"],
		[personal, /^Last name/, "Okafor"],
		[emergency, /^First name/, "Chidi"],
		[emergency, /^Last name/, "Okafor"],
	] as const) {
		fireEvent.input(fields.getByRole("textbox", { name: label }), { target: { value } });
	}
	fireEvent.click(personal.getByRole("button", { name: /^Date of birth/ }));
	fireEvent.click(within(await screen.findByRole("grid")).getAllByRole("button")[0]);
	await user.keyboard("{Escape}");
}

beforeEach(() => {
	createPatientMock.mockResolvedValue({ status: "success", patientId: "patient-1" });
});

test("shows each missing required detail under its own field, focuses the first one and does not save", async () => {
	const user = userEvent.setup();
	render(<ManualPatientClient returnTo="/dashboard/patients" />);
	await user.click(screen.getByRole("button", { name: "Save patient" }));

	const personal = section(/Personal Information/);
	const emergency = section(/Emergency Contact/);
	const firstName = personal.getByRole("textbox", { name: /^First name/ });
	await waitFor(() => expect(firstName).toHaveFocus());
	expect(firstName).toBeInvalid();
	expect(firstName).toHaveAccessibleDescription("First name is required.");
	expect(personal.getByRole("textbox", { name: /^Last name/ })).toHaveAccessibleDescription(
		"Last name is required.",
	);
	expect(personal.getByRole("button", { name: /^Date of birth/ })).toHaveAccessibleDescription(
		"Date of birth is required.",
	);
	expect(emergency.getByRole("textbox", { name: /^First name/ })).toHaveAccessibleDescription(
		"First name is required.",
	);
	expect(emergency.getByRole("textbox", { name: /^Last name/ })).toHaveAccessibleDescription(
		"Last name is required.",
	);
	const middleName = personal.getByRole("textbox", { name: "Middle name" });
	expect(middleName).toBeVisible();
	expect(middleName).not.toBeInvalid();
	expect(createPatientMock).not.toHaveBeenCalled();

	await user.type(firstName, "Ada");
	await waitFor(() => expect(firstName).not.toBeInvalid());
	expect(firstName).not.toHaveAccessibleDescription();
});

test("shows an invalid email under the email field instead of saving", async () => {
	const user = userEvent.setup();
	render(<ManualPatientClient returnTo="/dashboard/patients" />);
	await fillRequiredFields(user);
	const email = section(/Contact Information/).getByRole("textbox", { name: "Email address" });
	fireEvent.input(email, { target: { value: "ada-at-example" } });
	await user.click(screen.getByRole("button", { name: "Save patient" }));

	await waitFor(() => expect(email).toHaveAccessibleDescription("Enter a valid email address."));
	expect(email).toBeInvalid();
	expect(createPatientMock).not.toHaveBeenCalled();

	fireEvent.input(email, { target: { value: "ada@example.com" } });
	await user.click(screen.getByRole("button", { name: "Save patient" }));
	await waitFor(() => expect(createPatientMock).toHaveBeenCalled());
});

test("saves the entered patient and opens their record", async () => {
	const user = userEvent.setup();
	render(<ManualPatientClient returnTo="/dashboard/patients" />);
	await fillRequiredFields(user);
	await user.click(screen.getByRole("button", { name: "Save patient" }));

	await waitFor(() =>
		expect(pushMock).toHaveBeenCalledWith("/dashboard/patients/patient-1?section=patient-overview"),
	);
	const [savedPatient] = createPatientMock.mock.calls[0];
	expect(savedPatient.personalInformation).toMatchObject({ firstName: "Ada", lastName: "Okafor" });
	expect(savedPatient.personalInformation.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	expect(savedPatient.emergencyContact).toMatchObject({ firstName: "Chidi", lastName: "Okafor" });
});

test.each([
	{
		name: "the server rejects the patient",
		respond: () =>
			createPatientMock.mockResolvedValueOnce({
				status: "failed",
				error: "Your hospital must be verified before you can add patients.",
			}),
		message: "Your hospital must be verified before you can add patients.",
	},
	{
		name: "the request fails",
		respond: () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			createPatientMock.mockRejectedValueOnce(new Error("Network down"));
		},
		message: "We couldn’t save this patient. Please try again.",
	},
])(
	"shows a dismissible error and keeps the entered details when $name",
	async ({ respond, message }) => {
		const user = userEvent.setup();
		respond();
		render(<ManualPatientClient returnTo="/dashboard/patients" />);
		await fillRequiredFields(user);
		const saveButton = screen.getByRole("button", { name: "Save patient" });
		await user.click(saveButton);

		expect(await screen.findByRole("alert")).toHaveTextContent(message);
		expect(pushMock).not.toHaveBeenCalled();
		expect(
			section(/Personal Information/).getByRole("textbox", { name: /^First name/ }),
		).toHaveValue("Ada");
		await waitFor(() => expect(saveButton).toHaveTextContent("Save patient"));
		expect(saveButton).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Dismiss error" }));
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	},
);

test("collapses a section without losing entered values and reopens it from the keyboard", async () => {
	const user = userEvent.setup();
	render(<ManualPatientClient returnTo="/dashboard/patients" />);
	const personal = section(/Personal Information/);
	fireEvent.input(personal.getByRole("textbox", { name: /^First name/ }), {
		target: { value: "Ada" },
	});
	const toggle = personal.getByRole("button", { name: /Personal Information/ });

	await user.click(toggle);
	expect(toggle).toHaveAttribute("aria-expanded", "false");
	expect(personal.queryByRole("textbox", { name: /^First name/ })).not.toBeInTheDocument();

	toggle.focus();
	await user.keyboard("{Enter}");
	expect(toggle).toHaveAttribute("aria-expanded", "true");
	expect(personal.getByRole("textbox", { name: /^First name/ })).toHaveValue("Ada");
});

test("reopens a collapsed section that has an error and moves focus to it", async () => {
	const user = userEvent.setup();
	render(<ManualPatientClient returnTo="/dashboard/patients" />);
	await fillRequiredFields(user);
	const contact = section(/Contact Information/);
	const email = contact.getByRole("textbox", { name: "Email address" });
	fireEvent.input(email, { target: { value: "ada-at-example" } });
	const toggle = contact.getByRole("button", { name: /Contact Information/ });
	await user.click(toggle);
	expect(toggle).toHaveAttribute("aria-expanded", "false");

	await user.click(screen.getByRole("button", { name: "Save patient" }));

	await waitFor(() => expect(email).toHaveFocus());
	expect(toggle).toHaveAttribute("aria-expanded", "true");
	expect(email).toHaveAccessibleDescription("Enter a valid email address.");
	expect(createPatientMock).not.toHaveBeenCalled();
});

test("returns to the originating page when the user cancels", () => {
	render(<ManualPatientClient returnTo="/dashboard/overview" />);
	expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
		"href",
		"/dashboard/overview",
	);
});
