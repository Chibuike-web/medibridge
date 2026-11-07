import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import type { ImmunizationDetailsType } from "@/features/patients/types";
import { ImmunizationDetailsDrawer } from "./immunization-details-drawer";

const { saveImmunization } = vi.hoisted(() => ({ saveImmunization: vi.fn() }));
vi.mock("@/features/patients/server/update-patient-immunization-action", () => ({
	updatePatientImmunizationAction: saveImmunization,
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
	saveImmunization.mockResolvedValue({ status: "success" });
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

test("marks the immunization as completed, keeping its other values and version", async () => {
	const user = userEvent.setup();
	const { onImmunizationUpdated } = renderActiveImmunization();

	await user.click(screen.getByRole("button", { name: "Immunization actions" }));
	await user.click(screen.getByRole("menuitem", { name: "Mark as completed" }));

	await waitFor(() => expect(onImmunizationUpdated).toHaveBeenCalled());
	const [id, submitted] = saveImmunization.mock.calls[0] as [string, FormData];
	expect(id).toBe("IMM-review");
	expect(submitted.get("status")).toBe("Completed");
	expect(submitted.get("vaccineName")).toBe("Hepatitis B");
	expect(submitted.get("currentDose")).toBe("2");
	expect(submitted.get("dateAdministered")).toBe("2026-01-01");
	expect(submitted.get("updatedAt")).toBe(immunization.editValues.updatedAt);
});

test("discontinues the immunization only after the dialog is confirmed", async () => {
	const user = userEvent.setup();
	const { onImmunizationUpdated } = renderActiveImmunization();

	await user.click(screen.getByRole("button", { name: "Immunization actions" }));
	await user.click(screen.getByRole("menuitem", { name: "Discontinue" }));
	const dialog = await screen.findByRole("alertdialog", { name: "Discontinue immunization?" });
	expect(saveImmunization).not.toHaveBeenCalled();

	await user.click(within(dialog).getByRole("button", { name: "Discontinue immunization" }));

	await waitFor(() => expect(onImmunizationUpdated).toHaveBeenCalled());
	const [, submitted] = saveImmunization.mock.calls[0] as [string, FormData];
	expect(submitted.get("status")).toBe("Discontinued");
});
