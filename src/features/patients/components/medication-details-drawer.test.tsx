import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import type { MedicationDetailsType } from "@/features/patients/types";
import { MedicationDetailsDrawer } from "./medication-details-drawer";

const { saveMedication } = vi.hoisted(() => ({ saveMedication: vi.fn() }));
vi.mock("@/features/patients/server/update-patient-medication-action", () => ({
	updatePatientMedicationAction: saveMedication,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: { useActiveMemberRole: () => ({ data: { role: "owner" } }) },
}));

const medication: MedicationDetailsType = {
	medicationId: "MED-review",
	encounterId: null,
	name: "Review medication",
	dose: "500 mg",
	route: "Oral",
	indication: "Review indication",
	status: "Active",
	frequency: "Once daily",
	duration: "7 days",
	prescribedBy: "Review editor",
	startedAt: "1 January 2026",
	createdAt: "1 January 2026",
	updatedAt: "2 January 2026",
	createdBy: "Review editor",
	clinicalNote: "Review note",
	history: [],
	editValues: {
		updatedAt: "2026-01-02T09:00:00.000Z",
		dose: "500 mg",
		route: "Oral",
		indication: "Review indication",
		frequency: "Once daily",
		duration: "7 days",
		prescribedBy: "Review editor",
		startedAt: "2026-01-01",
		clinicalNote: "Review note",
	},
};

beforeEach(() => {
	saveMedication.mockResolvedValue({ status: "success" });
});

test("submits the original record version and preserves entered values when refreshed data arrives during editing", async () => {
	const user = userEvent.setup();
	const props = {
		open: true,
		onOpenChange: vi.fn(),
		medication,
		isLoading: false,
		onMedicationUpdated: vi.fn(),
	};
	const { rerender } = render(<MedicationDetailsDrawer {...props} />);
	await user.click(screen.getByRole("button", { name: "Medication actions" }));
	await user.click(screen.getByRole("menuitem", { name: /^Edit$/ }));
	const dialog = screen.getByRole("dialog", { name: "Edit medication details" });
	const dose = within(dialog).getByLabelText(/Dose/);
	await user.clear(dose);
	await user.type(dose, "250 mg");
	const refreshed = {
		...medication,
		dose: "1000 mg",
		editValues: {
			...medication.editValues,
			dose: "1000 mg",
			updatedAt: "2026-01-02T10:00:00.000Z",
		},
	};
	rerender(<MedicationDetailsDrawer {...props} medication={refreshed} />);
	expect(within(dialog).getByLabelText(/Dose/)).toHaveValue("250 mg");
	await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
	await waitFor(() => expect(saveMedication).toHaveBeenCalled());
	const [id, submitted] = saveMedication.mock.calls[0] as [string, FormData];
	expect(id).toBe("MED-review");
	expect(submitted.get("dose")).toBe("250 mg");
	expect(submitted.get("updatedAt")).toBe(medication.editValues.updatedAt);
});

test("starts a fresh edit with the new record values and version when the selected record changes", async () => {
	const user = userEvent.setup();
	const props = {
		open: true,
		onOpenChange: vi.fn(),
		medication,
		isLoading: false,
		onMedicationUpdated: vi.fn(),
	};
	const { rerender } = render(<MedicationDetailsDrawer {...props} />);
	await user.click(screen.getByRole("button", { name: "Medication actions" }));
	await user.click(screen.getByRole("menuitem", { name: /^Edit$/ }));
	const dose = screen.getByLabelText(/Dose/);
	await user.clear(dose);
	await user.type(dose, "250 mg");
	const nextMedication = {
		...medication,
		medicationId: "MED-next",
		name: "Next medication",
		dose: "1000 mg",
		editValues: {
			...medication.editValues,
			dose: "1000 mg",
			updatedAt: "2026-01-02T11:00:00.000Z",
		},
	};
	rerender(<MedicationDetailsDrawer {...props} medication={nextMedication} />);
	const dialog = screen.getByRole("dialog", { name: "Edit medication details" });
	expect(within(dialog).getByLabelText(/^Medication/)).toHaveValue("Next medication");
	expect(within(dialog).getByLabelText(/Dose/)).toHaveValue("1000 mg");
	await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
	await waitFor(() => expect(saveMedication).toHaveBeenCalled());
	const [id, submitted] = saveMedication.mock.calls[0] as [string, FormData];
	expect(id).toBe("MED-next");
	expect(submitted.get("dose")).toBe("1000 mg");
	expect(submitted.get("updatedAt")).toBe(nextMedication.editValues.updatedAt);
});

function renderActiveMedication() {
	const onMedicationUpdated = vi.fn();
	render(
		<MedicationDetailsDrawer
			open
			onOpenChange={vi.fn()}
			medication={medication}
			isLoading={false}
			onMedicationUpdated={onMedicationUpdated}
		/>,
	);
	return { onMedicationUpdated };
}

test("marks the medication as completed, keeping its other values and version", async () => {
	const user = userEvent.setup();
	const { onMedicationUpdated } = renderActiveMedication();

	await user.click(screen.getByRole("button", { name: "Medication actions" }));
	await user.click(screen.getByRole("menuitem", { name: "Mark as completed" }));

	await waitFor(() => expect(onMedicationUpdated).toHaveBeenCalled());
	const [id, submitted] = saveMedication.mock.calls[0] as [string, FormData];
	expect(id).toBe("MED-review");
	expect(submitted.get("status")).toBe("Completed");
	expect(submitted.get("medicationName")).toBe("Review medication");
	expect(submitted.get("dose")).toBe("500 mg");
	expect(submitted.get("startedAt")).toBe("2026-01-01");
	expect(submitted.get("updatedAt")).toBe(medication.editValues.updatedAt);
});

test("discontinues the medication only after the dialog is confirmed", async () => {
	const user = userEvent.setup();
	const { onMedicationUpdated } = renderActiveMedication();

	await user.click(screen.getByRole("button", { name: "Medication actions" }));
	await user.click(screen.getByRole("menuitem", { name: "Discontinue" }));
	const dialog = await screen.findByRole("alertdialog", { name: "Discontinue medication?" });
	expect(saveMedication).not.toHaveBeenCalled();

	await user.click(within(dialog).getByRole("button", { name: "Discontinue medication" }));

	await waitFor(() => expect(onMedicationUpdated).toHaveBeenCalled());
	const [, submitted] = saveMedication.mock.calls[0] as [string, FormData];
	expect(submitted.get("status")).toBe("Discontinued");
	await waitFor(() =>
		expect(
			screen.queryByRole("alertdialog", { name: "Discontinue medication?" }),
		).not.toBeInTheDocument(),
	);
});

test("shows the server's error in the drawer when the status can't be saved", async () => {
	const user = userEvent.setup();
	saveMedication.mockResolvedValue({
		status: "failed",
		error: "This medication was changed after you opened it.",
	});
	const { onMedicationUpdated } = renderActiveMedication();

	await user.click(screen.getByRole("button", { name: "Medication actions" }));
	await user.click(screen.getByRole("menuitem", { name: "Mark as completed" }));

	expect(await screen.findByRole("alert")).toHaveTextContent(
		"This medication was changed after you opened it.",
	);
	expect(onMedicationUpdated).not.toHaveBeenCalled();
});
