import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { PhysicalInformation } from "./physical-information";

const { updatePhysicalMock } = vi.hoisted(() => ({ updatePhysicalMock: vi.fn() }));
vi.mock("@/features/patients/server/update-patient-physical-information-action", () => ({
	updatePatientPhysicalInformationAction: updatePhysicalMock,
}));

const physicalInformation = [
	{ label: "Height", value: "165 cm" },
	{ label: "Weight", value: "60 kg" },
	{ label: "Blood group", value: "A+" },
	{ label: "Genotype", value: "AA" },
];

beforeEach(() => {
	updatePhysicalMock.mockReset();
	updatePhysicalMock.mockResolvedValue({ status: "success" });
});

test("keeps the saved height and weight when the patient's physical information is edited", async () => {
	const user = userEvent.setup();
	render(<PhysicalInformation patientId="patient-1" physicalInformation={physicalInformation} />);
	await user.click(screen.getByRole("button", { name: "Open actions for Physical Information" }));
	await user.click(screen.getByRole("menuitem", { name: "Edit info" }));
	const dialog = within(screen.getByRole("dialog", { name: "Edit Physical Information" }));

	expect(dialog.getByLabelText("Height")).toHaveValue("165 cm");
	expect(dialog.getByLabelText("Weight")).toHaveValue("60 kg");

	await user.click(dialog.getByRole("button", { name: "Save changes" }));

	await waitFor(() => expect(updatePhysicalMock).toHaveBeenCalled());
	const [patientId, submittedPhysicalInformation] = updatePhysicalMock.mock.calls[0];
	expect(patientId).toBe("patient-1");
	expect(submittedPhysicalInformation.get("height")).toBe("165 cm");
	expect(submittedPhysicalInformation.get("weight")).toBe("60 kg");
});
