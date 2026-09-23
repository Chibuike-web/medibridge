import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { SharedAllergiesTable, type SharedAllergyRow } from "./allergies-table";

vi.mock("../shared-record-table-actions", () => ({
	getSharedAllergiesTableAction: vi.fn(),
}));

test("shared records display and sort every supplied allergy without hiding later records", async () => {
	const user = userEvent.setup();
	const rows: SharedAllergyRow[] = Array.from({ length: 14 }, (_, index) => ({
		allergen: `Allergen ${String(index + 1).padStart(2, "0")}`,
		allergyId: `AL-${index + 1}`,
		reaction: "Rash",
		createdAt: "Sep 1, 2026",
		createdAtValue: "2026-09-01",
		severity: "Mild",
		status: "Active",
	}));
	render(<SharedAllergiesTable accessId="test-access" rows={rows} />);
	const table = screen.getByRole("table");
	const displayedAllergens = () =>
		within(table)
			.getAllByRole("cell", { name: /^Allergen \d+$/ })
			.map((cell) => cell.textContent);
	for (const allergy of rows) {
		expect(within(table).getByText(allergy.allergen)).toBeVisible();
	}
	expect(screen.getByRole("columnheader", { name: "Allergen" })).toHaveAttribute(
		"aria-sort",
		"ascending",
	);
	await user.click(screen.getByRole("columnheader", { name: "Allergen" }));
	expect(displayedAllergens()).toEqual(rows.map((allergy) => allergy.allergen).reverse());
});
