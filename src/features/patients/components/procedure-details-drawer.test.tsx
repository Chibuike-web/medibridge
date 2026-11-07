import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import type { ProcedureDetailsType } from "@/features/patients/types";
import { ProcedureDetailsDrawer } from "./procedure-details-drawer";

const { markProcedureCompleted } = vi.hoisted(() => ({ markProcedureCompleted: vi.fn() }));
vi.mock("@/features/patients/server/mark-patient-procedure-completed-action", () => ({
	markPatientProcedureCompletedAction: markProcedureCompleted,
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
	markProcedureCompleted.mockResolvedValue({ status: "success" });
});

test("marks the procedure as completed for the version that was opened", async () => {
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
	expect(markProcedureCompleted).toHaveBeenCalledWith("PRO-review", procedure.editValues.updatedAt);
});
