import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import type { ImmunizationDetailsType } from "@/features/patients/types";
import { ImmunizationDetailsDrawer } from "./immunization-details-drawer";

const { markImmunizationCompleted, discontinueImmunization } = vi.hoisted(() => ({
	markImmunizationCompleted: vi.fn(),
	discontinueImmunization: vi.fn(),
}));
vi.mock("@/features/patients/server/mark-patient-immunization-completed-action", () => ({
	markPatientImmunizationCompletedAction: markImmunizationCompleted,
}));
vi.mock("@/features/patients/server/discontinue-patient-immunization-action", () => ({
	discontinuePatientImmunizationAction: discontinueImmunization,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: { useActiveMemberRole: () => ({ data: { role: "owner" } }) },
}));

const immunization: ImmunizationDetailsType = {
	immunizationId: "IMM-review",
	encounterId: null,
	vaccineName: "Hepatitis B",
	seriesType: "Primary",
	currentDose: "2",
	totalDoses: "3",
	status: "Active",
	dateAdministered: "1 January 2026",
	administeredBy: "Nurse Ada",
	createdAt: "1 January 2026",
	updatedAt: "2 January 2026",
	createdBy: "Nurse Ada",
	updatedBy: "Nurse Ada",
	clinicalNote: "Second dose given",
	editValues: {
		updatedAt: "2026-01-02T09:00:00.000Z",
		seriesType: "Primary",
		currentDose: "2",
		totalDoses: "3",
		dateAdministered: "2026-01-01",
		administeredBy: "Nurse Ada",
		clinicalNote: "Second dose given",
	},
	history: [],
};

beforeEach(() => {
	markImmunizationCompleted.mockResolvedValue({ status: "success" });
	discontinueImmunization.mockResolvedValue({ status: "success" });
});

function renderActiveImmunization() {
	const onImmunizationUpdated = vi.fn();
	render(
		<ImmunizationDetailsDrawer
			open
			onOpenChange={vi.fn()}
			immunization={immunization}
			isLoading={false}
			onImmunizationUpdated={onImmunizationUpdated}
		/>,
	);
	return { onImmunizationUpdated };
}

test("marks the immunization as completed for the version that was opened", async () => {
	const user = userEvent.setup();
	const { onImmunizationUpdated } = renderActiveImmunization();

	await user.click(screen.getByRole("button", { name: "Immunization actions" }));
	await user.click(screen.getByRole("menuitem", { name: "Mark as completed" }));

	await waitFor(() => expect(onImmunizationUpdated).toHaveBeenCalled());
	expect(markImmunizationCompleted).toHaveBeenCalledWith(
		"IMM-review",
		immunization.editValues.updatedAt,
	);
	expect(discontinueImmunization).not.toHaveBeenCalled();
});

test("discontinues the immunization only after the dialog is confirmed", async () => {
	const user = userEvent.setup();
	const { onImmunizationUpdated } = renderActiveImmunization();

	await user.click(screen.getByRole("button", { name: "Immunization actions" }));
	await user.click(screen.getByRole("menuitem", { name: "Discontinue" }));
	const dialog = await screen.findByRole("alertdialog", { name: "Discontinue immunization?" });
	expect(discontinueImmunization).not.toHaveBeenCalled();

	await user.click(within(dialog).getByRole("button", { name: "Discontinue immunization" }));

	await waitFor(() => expect(onImmunizationUpdated).toHaveBeenCalled());
	expect(discontinueImmunization).toHaveBeenCalledWith(
		"IMM-review",
		immunization.editValues.updatedAt,
	);
});
