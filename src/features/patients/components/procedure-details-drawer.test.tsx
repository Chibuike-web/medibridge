import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import type { ProcedureDetailsType } from "@/features/patients/types";
import { ProcedureDetailsDrawer } from "./procedure-details-drawer";

const { saveProcedure } = vi.hoisted(() => ({ saveProcedure: vi.fn() }));
vi.mock("@/features/patients/server/update-patient-procedure-action", () => ({
	updatePatientProcedureAction: saveProcedure,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: { useActiveMemberRole: () => ({ data: { role: "owner" } }) },
}));

const procedure: ProcedureDetailsType = {
	procedureId: "PRO-review",
	encounterId: null,
	name: "Appendectomy",
	indication: "Appendicitis",
	status: "Pending",
	procedureDate: "1 January 2026",
	performedBy: "Dr. Obi",
	assistants: ["Nurse Ada"],
	facility: "Theatre 2",
	plannedDate: "1 January 2026",
	plannedPhysician: "Dr. Obi",
	plannedAssistants: ["Nurse Ada"],
	plannedFacility: "Theatre 2",
	clinicalNote: "Planned under general anaesthesia",
	createdAt: "1 January 2026",
	updatedAt: "2 January 2026",
	createdBy: "Dr. Obi",
	updatedBy: "Dr. Obi",
	relatedRecords: { diagnosis: null, medication: null },
	editValues: {
		updatedAt: "2026-01-02T09:00:00.000Z",
		indication: "Appendicitis",
		procedureDate: "2026-01-01",
		physician: "Dr. Obi",
		assistants: "Nurse Ada",
		facility: "Theatre 2",
		clinicalNote: "Planned under general anaesthesia",
	},
	history: [],
};

beforeEach(() => {
	saveProcedure.mockResolvedValue({ status: "success" });
});

test("marks the procedure as completed, keeping its other values and version", async () => {
	const user = userEvent.setup();
	const onProcedureUpdated = vi.fn();
	render(
		<ProcedureDetailsDrawer
			open
			onOpenChange={vi.fn()}
			procedure={procedure}
			isLoading={false}
			onProcedureUpdated={onProcedureUpdated}
		/>,
	);

	await user.click(screen.getByRole("button", { name: "Procedure actions" }));
	await user.click(screen.getByRole("menuitem", { name: "Mark as completed" }));

	await waitFor(() => expect(onProcedureUpdated).toHaveBeenCalled());
	const [id, submitted] = saveProcedure.mock.calls[0] as [string, FormData];
	expect(id).toBe("PRO-review");
	expect(submitted.get("status")).toBe("Completed");
	expect(submitted.get("procedureName")).toBe("Appendectomy");
	expect(submitted.get("procedureDate")).toBe("2026-01-01");
	expect(submitted.get("assistants")).toBe("Nurse Ada");
	expect(submitted.get("updatedAt")).toBe(procedure.editValues.updatedAt);
});
