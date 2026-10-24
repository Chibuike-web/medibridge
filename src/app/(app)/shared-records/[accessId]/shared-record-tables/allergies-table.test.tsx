import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { getSharedAllergiesTableAction } from "../shared-record-table-actions";
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

test("Clear all removes every filter pill and reloads the allergies without filters", async () => {
	const user = userEvent.setup();
	const rows: SharedAllergyRow[] = [
		{
			allergen: "Penicillin",
			allergyId: "AL-1",
			reaction: "Rash",
			createdAt: "Sep 1, 2026",
			createdAtValue: "2026-09-01",
			severity: "Mild",
			status: "Inactive",
		},
	];
	const getSharedAllergies = vi.mocked(getSharedAllergiesTableAction).mockResolvedValue(rows);
	render(<SharedAllergiesTable accessId="test-access" rows={rows} />);

	await user.click(screen.getByRole("button", { name: "Filter" }));
	await user.click(screen.getByRole("menuitem", { name: "Status" }));
	await user.pointer({
		keys: "[TouchA]",
		target: await screen.findByRole("checkbox", { name: "Inactive" }),
	});
	await user.keyboard("{Escape}{Escape}");
	expect(await screen.findByText("Status: Inactive")).toBeVisible();

	getSharedAllergies.mockClear();
	await user.click(screen.getByRole("button", { name: "Clear all" }));

	expect(screen.queryByText("Status: Inactive")).not.toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
	expect(getSharedAllergies).toHaveBeenCalledTimes(1);
	expect(getSharedAllergies).toHaveBeenCalledWith({
		accessId: "test-access",
		query: "",
		statusFilters: [],
		severityFilters: [],
		createdFrom: "",
		createdTo: "",
	});
});

test("keeps filter options interactive while earlier filtered results are loading", async () => {
	const rows: SharedAllergyRow[] = [
		{
			allergen: "Penicillin",
			allergyId: "AL-1",
			reaction: "Rash",
			createdAt: "Sep 1, 2026",
			createdAtValue: "2026-09-01",
			severity: "Mild",
			status: "Inactive",
		},
	];
	let finishRefresh!: (rows: SharedAllergyRow[]) => void;
	const refreshedRows = new Promise<SharedAllergyRow[]>((resolve) => {
		finishRefresh = resolve;
	});
	const getSharedAllergies = vi.mocked(getSharedAllergiesTableAction);
	getSharedAllergies.mockReset();
	getSharedAllergies.mockReturnValue(refreshedRows);
	const user = userEvent.setup();
	render(<SharedAllergiesTable accessId="test-access" rows={rows} />);
	const table = screen.getByRole("table");
	await user.click(screen.getByRole("button", { name: "Filter" }));
	await user.click(screen.getByRole("menuitem", { name: "Status" }));
	const activeOption = await screen.findByRole("checkbox", { name: "Active" });
	const inactiveOption = screen.getByRole("checkbox", { name: "Inactive" });
	expect(activeOption).not.toBeChecked();
	expect(inactiveOption).not.toBeChecked();

	try {
		await user.pointer({ keys: "[TouchA]", target: activeOption });
		expect(table).toHaveAttribute("aria-busy", "true");
		expect(activeOption).toBeChecked();
		expect(inactiveOption).not.toBeChecked();
		expect(activeOption).toBeEnabled();
		expect(inactiveOption).toBeEnabled();

		await user.pointer({ keys: "[TouchA]", target: inactiveOption });
		expect(activeOption).toBeChecked();
		expect(inactiveOption).toBeChecked();
		expect(getSharedAllergies.mock.lastCall?.[0].statusFilters).toEqual(["Active", "Inactive"]);

		await user.pointer({ keys: "[TouchA]", target: activeOption });
		expect(activeOption).not.toBeChecked();
		expect(inactiveOption).toBeChecked();
		expect(getSharedAllergies.mock.lastCall?.[0].statusFilters).toEqual(["Inactive"]);
	} finally {
		await act(async () => {
			finishRefresh(rows);
			await refreshedRows;
		});
	}
});
