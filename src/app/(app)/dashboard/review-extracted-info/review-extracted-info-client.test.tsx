import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { PatientSchema, type PatientType } from "@/features/patients/schemas/patient-schema";
import { useExtractedPatientStore } from "@/features/patients/store/use-extracted-patient-store";
import { ReviewExtractedInfoClient } from "./review-extracted-info-client";

const { savePatientsMock, replaceMock } = vi.hoisted(() => ({
	savePatientsMock: vi.fn(),
	replaceMock: vi.fn(),
}));

vi.mock("@/features/patients/server/save-patients-action", () => ({
	savePatientsAction: savePatientsMock,
}));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: replaceMock }),
}));

const patients: PatientType = [
	{
		personalInfo: {
			firstName: "Ada",
			middleName: null,
			lastName: "Okafor",
			patientId: "PAT-001",
			dateOfBirth: "1994-04-12",
			sex: "female",
			age: 32,
			maritalStatus: "single",
			nationalId: null,
		},
		contactInfo: {
			phoneNumber: "08011111111",
			emailAddress: "ada@example.com",
			residentialAddress: "12 Hospital Road",
			stateOfOrigin: "Enugu",
			countryOfOrigin: "Nigeria",
		},
		emergencyInfo: {
			firstName: "Emeka",
			middleName: null,
			lastName: "Okafor",
			relationship: "brother",
			phone: "08022222222",
		},
		physicalInfo: { height: "165 cm", weight: "60 kg", bloodGroup: "O+", genotype: "AA" },
	},
	{
		personalInfo: {
			firstName: "Bola",
			middleName: null,
			lastName: "Adeyemi",
			patientId: "PAT-002",
			dateOfBirth: "1986-02-03",
			sex: "male",
			age: 40,
			maritalStatus: "married",
			nationalId: "NIN-002",
		},
		contactInfo: {
			phoneNumber: "08033333333",
			emailAddress: "bola@example.com",
			residentialAddress: "20 Clinic Road",
			stateOfOrigin: "Lagos",
			countryOfOrigin: "Nigeria",
		},
		emergencyInfo: {
			firstName: "Tola",
			middleName: null,
			lastName: "Adeyemi",
			relationship: "sister",
			phone: "08044444444",
		},
		physicalInfo: { height: "180 cm", weight: "80 kg", bloodGroup: "A+", genotype: "AS" },
	},
];

describe("review extracted patient information", () => {
	beforeEach(() => {
		// JSDOM has no layout engine; Motion needs nonzero bounds to complete shared transitions.
		vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
			new DOMRect(0, 0, 600, 300),
		);
		localStorage.clear();
		useExtractedPatientStore.setState({ patientData: structuredClone(patients), isHydrated: true });
		savePatientsMock.mockReset();
		savePatientsMock.mockResolvedValue({ status: "success", savedCount: patients.length });
	});

	afterEach(() => vi.restoreAllMocks());

	test("opens the selected patient's details from the keyboard and returns focus when closed", async () => {
		const user = userEvent.setup();
		render(<ReviewExtractedInfoClient />);
		const patientCard = screen.getByRole("button", { name: "Bola Adeyemi" });
		expect(patientCard).toBeVisible();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

		patientCard.focus();
		await user.keyboard("{Enter}");
		const dialog = screen.getByRole("dialog", { name: "Bola Adeyemi" });
		expect(within(dialog).getByRole("region", { name: "Personal Info" })).toHaveTextContent(
			"PAT-002",
		);
		expect(within(dialog).getByRole("region", { name: "Contact Info" })).toHaveTextContent(
			"bola@example.com",
		);

		await user.keyboard("{Escape}");
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		await waitFor(() => expect(patientCard).toHaveFocus());
	});

	test("keeps saved changes in each section and leaves the other patient's information unchanged", async () => {
		const user = userEvent.setup();
		render(<ReviewExtractedInfoClient />);
		await user.click(screen.getByRole("button", { name: "Ada Okafor" }));
		const dialog = screen.getByRole("dialog", { name: "Ada Okafor" });

		const updates = [
			{ section: "Personal Info", label: "First name", value: "Adanna" },
			{ section: "Contact Info", label: "Phone number", value: "08055555555" },
			{ section: "Emergency Info", label: "First name", value: "Chidi" },
			{ section: "Physical Info", label: "Blood group", value: "AB+" },
		];
		for (const update of updates) {
			const section = within(dialog).getByRole("region", { name: update.section });
			await user.click(within(section).getByRole("button", { name: `Edit ${update.label}` }));
			const input = within(section).getByLabelText(update.label);
			expect(input).toHaveFocus();
			await user.clear(input);
			await user.type(input, update.value);
			await user.click(within(section).getByRole("button", { name: "Save" }));
			expect(section).toHaveTextContent(update.value);
		}
		await user.click(within(dialog).getByRole("button", { name: "Close patient details" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		expect(screen.getByRole("button", { name: "Adanna Okafor" })).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Bola Adeyemi" }));
		expect(
			within(screen.getByRole("dialog", { name: "Bola Adeyemi" })).getByRole("region", {
				name: "Contact Info",
			}),
		).toHaveTextContent("08033333333");
		await user.click(screen.getByRole("button", { name: "Close patient details" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		await user.click(screen.getByRole("button", { name: "Save Patient" }));

		const expectedPatients = structuredClone(patients);
		expectedPatients[0].personalInfo.firstName = "Adanna";
		expectedPatients[0].contactInfo.phoneNumber = "08055555555";
		expectedPatients[0].emergencyInfo.firstName = "Chidi";
		expectedPatients[0].physicalInfo.bloodGroup = "AB+";
		expect(savePatientsMock).toHaveBeenCalledWith(expectedPatients);
	});

	test("canceling an edit and closing an unsaved draft preserve the original values", async () => {
		const user = userEvent.setup();
		render(<ReviewExtractedInfoClient />);
		await user.click(screen.getByRole("button", { name: "Ada Okafor" }));
		const section = within(screen.getByRole("dialog")).getByRole("region", {
			name: "Personal Info",
		});
		expect(section).toHaveTextContent("Ada");
		await user.click(within(section).getByRole("button", { name: "Edit First name" }));
		await user.clear(within(section).getByLabelText("First name"));
		await user.type(within(section).getByLabelText("First name"), "Unsaved");
		await user.click(within(section).getByRole("button", { name: "Cancel" }));
		expect(section).toHaveTextContent("Ada");
		expect(section).not.toHaveTextContent("Unsaved");
		await user.click(within(section).getByRole("button", { name: "Edit First name" }));
		await user.clear(within(section).getByLabelText("First name"));
		await user.type(within(section).getByLabelText("First name"), "Draft");
		await user.click(screen.getByRole("button", { name: "Close patient details" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		await user.click(screen.getByRole("button", { name: "Ada Okafor" }));
		const reopenedSection = within(screen.getByRole("dialog")).getByRole("region", {
			name: "Personal Info",
		});
		expect(reopenedSection).toHaveTextContent("Ada");
		expect(within(reopenedSection).queryByRole("textbox")).not.toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Close patient details" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		await user.click(screen.getByRole("button", { name: "Save Patient" }));
		expect(savePatientsMock).toHaveBeenCalledWith(patients);
	});

	test.each([
		{ input: "0", expected: 0 },
		{ input: "35", expected: 35 },
		{ input: "", expected: null },
	])(
		"saves an edited age of '$input' as $expected in a valid patient payload",
		async ({ input, expected }) => {
			const user = userEvent.setup();
			render(<ReviewExtractedInfoClient />);
			await user.click(screen.getByRole("button", { name: "Ada Okafor" }));
			const section = within(screen.getByRole("dialog")).getByRole("region", {
				name: "Personal Info",
			});
			await user.click(within(section).getByRole("button", { name: "Edit Age" }));
			const ageInput = within(section).getByRole("spinbutton", { name: "Age" });
			await user.clear(ageInput);
			if (input) await user.type(ageInput, input);
			await user.keyboard("{Enter}");
			expect(section).toHaveTextContent(expected === null ? "--" : String(expected));
			await user.click(screen.getByRole("button", { name: "Close patient details" }));
			await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
			await user.click(screen.getByRole("button", { name: "Save Patient" }));

			const expectedPatients = structuredClone(patients);
			expectedPatients[0].personalInfo.age = expected;
			expect(savePatientsMock).toHaveBeenCalledWith(expectedPatients);
			expect(PatientSchema.safeParse(savePatientsMock.mock.calls[0][0]).success).toBe(true);
		},
	);

	test("retains saved edits after the page is reopened", async () => {
		const user = userEvent.setup();
		const firstRender = render(<ReviewExtractedInfoClient />);
		await user.click(screen.getByRole("button", { name: "Ada Okafor" }));
		const section = within(screen.getByRole("dialog")).getByRole("region", {
			name: "Contact Info",
		});
		await user.click(within(section).getByRole("button", { name: "Edit Phone number" }));
		await user.clear(within(section).getByLabelText("Phone number"));
		await user.type(within(section).getByLabelText("Phone number"), "08099999999");
		await user.click(within(section).getByRole("button", { name: "Save" }));
		firstRender.unmount();
		await act(() => useExtractedPatientStore.persist.rehydrate());
		render(<ReviewExtractedInfoClient />);
		await user.click(screen.getByRole("button", { name: "Ada Okafor" }));
		expect(
			within(screen.getByRole("dialog")).getByRole("region", { name: "Contact Info" }),
		).toHaveTextContent("08099999999");
	});

	test.each(["pointer", "keyboard"])(
		"announces the pending save and prevents duplicate submission when activated by %s",
		async (inputMethod) => {
			let finishSave: (result: { status: "success"; savedCount: number }) => void = () => {};
			savePatientsMock.mockReturnValue(
				new Promise((resolve) => {
					finishSave = resolve;
				}),
			);
			const user = userEvent.setup();
			render(<ReviewExtractedInfoClient />);
			const saveButton = screen.getByRole("button", { name: "Save Patient" });

			if (inputMethod === "keyboard") {
				saveButton.focus();
				await user.keyboard("{Enter}");
			} else {
				await user.click(saveButton);
			}

			const pendingButton = screen.getByRole("button", { name: "Saving..." });
			expect(pendingButton).toBeDisabled();
			expect(pendingButton).toHaveAttribute("aria-busy", "true");
			expect(screen.queryByRole("button", { name: "Save Patient" })).not.toBeInTheDocument();
			expect(screen.getByRole("button", { name: "Ada Okafor" })).toBeVisible();
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
			await user.click(pendingButton);
			expect(savePatientsMock).toHaveBeenCalledTimes(1);

			await act(async () => finishSave({ status: "success", savedCount: patients.length }));
			expect(
				await screen.findByRole("dialog", { name: "Patient Saved Successfully" }),
			).toBeVisible();
		},
	);

	test("retains patients on a failed save and shows success after retrying", async () => {
		savePatientsMock.mockResolvedValueOnce({ status: "failed", error: "Unable to save patients." });
		const user = userEvent.setup();
		render(<ReviewExtractedInfoClient />);
		await user.click(screen.getByRole("button", { name: "Save Patient" }));
		expect(await screen.findByRole("alert")).toHaveTextContent("Unable to save patients.");
		expect(screen.getByRole("button", { name: "Ada Okafor" })).toBeVisible();
		expect(screen.getByRole("button", { name: "Bola Adeyemi" })).toBeVisible();
		expect(
			screen.queryByRole("dialog", { name: "Patient Saved Successfully" }),
		).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Save Patient" }));
		const successDialog = await screen.findByRole("dialog", { name: "Patient Saved Successfully" });
		expect(within(successDialog).getByRole("link", { name: "Add Another Record" })).toHaveAttribute(
			"href",
			"/dashboard/add-new-patient",
		);
		await user.click(within(successDialog).getByRole("button", { name: "Return to Dashboard" }));
		expect(replaceMock).toHaveBeenCalledWith("/dashboard");
	});

	test("clears the extracted patients after saving so reopening the page cannot submit them again", async () => {
		const user = userEvent.setup();
		const firstRender = render(<ReviewExtractedInfoClient />);
		await user.click(screen.getByRole("button", { name: "Save Patient" }));
		expect(await screen.findByRole("dialog", { name: "Patient Saved Successfully" })).toBeVisible();
		firstRender.unmount();
		await act(() => useExtractedPatientStore.persist.rehydrate());
		render(<ReviewExtractedInfoClient />);
		expect(screen.getByRole("heading", { name: "No patient data extracted" })).toBeVisible();
		expect(screen.queryByRole("button", { name: "Save Patient" })).not.toBeInTheDocument();
	});
});
