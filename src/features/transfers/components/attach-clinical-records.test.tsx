import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { clinicalRecords } from "@/features/transfers/data";
import { AttachClinicalRecords } from "./attach-clinical-records";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

function renderAttachmentTabs() {
	render(
		<SWRConfig value={{ provider: () => new Map(), revalidateOnFocus: false }}>
			<AttachClinicalRecords
				activePatient="synthetic-patient"
				attachedRecords={[]}
				onRecordToggle={vi.fn()}
			/>
		</SWRConfig>,
	);
}

describe("clinical record category tabs", () => {
	beforeEach(() => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({
					records: [],
					page: 1,
					totalPages: 1,
					totalRecords: 0,
				}),
			),
		);
	});
	afterEach(() => vi.unstubAllGlobals());

	test("lets the user choose a category with one accessible tab per category", async () => {
		const user = userEvent.setup();
		renderAttachmentTabs();
		const tabs = within(screen.getByRole("tablist"));
		for (const record of clinicalRecords) {
			expect(tabs.getByRole("tab", { name: record.label })).toBeVisible();
		}
		expect(tabs.getAllByRole("tab")).toHaveLength(clinicalRecords.length);
		expect(tabs.getByRole("tab", { name: "Patient Details" })).toHaveAttribute(
			"aria-selected",
			"true",
		);

		await user.click(tabs.getByRole("tab", { name: "Allergies" }));
		expect(tabs.getByRole("tab", { name: "Allergies" })).toHaveAttribute("aria-selected", "true");
		expect(tabs.getByRole("tab", { name: "Patient Details" })).toHaveAttribute(
			"aria-selected",
			"false",
		);
		expect(screen.getByRole("button", { name: "Select allergies records" })).toBeVisible();
	});

	test("moves keyboard focus and selection between categories with arrow keys", async () => {
		const user = userEvent.setup();
		renderAttachmentTabs();
		const diagnosesTab = screen.getByRole("tab", { name: "Diagnoses" });
		const allergiesTab = screen.getByRole("tab", { name: "Allergies" });
		await user.click(diagnosesTab);
		expect(diagnosesTab).toHaveFocus();
		await user.keyboard("{ArrowRight}");
		expect(allergiesTab).toHaveFocus();
		expect(allergiesTab).toHaveAttribute("aria-selected", "true");
		await user.keyboard("{ArrowLeft}");
		expect(diagnosesTab).toHaveFocus();
		expect(diagnosesTab).toHaveAttribute("aria-selected", "true");
	});
});
