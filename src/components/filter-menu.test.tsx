import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { SetDateRangeDialog, type DateRangeFilter } from "./date-range-filter";
import { DateFilterSection, FilterGroup } from "./filter-menu";

function DateFilterInGroup() {
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);

	return (
		<>
			<FilterGroup activeFilterCount={0}>
				<DateFilterSection
					label="Created at"
					from=""
					to=""
					onDateRangeApply={() => {}}
					onCustomDateRangeSelect={setCustomDateRangeFilter}
				/>
			</FilterGroup>
			<SetDateRangeDialog
				dateRangeFilter={customDateRangeFilter}
				onClose={() => setCustomDateRangeFilter(null)}
			/>
		</>
	);
}

beforeEach(() => {
	vi.stubGlobal("matchMedia", () => ({
		matches: true,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	}));
});

test("opens the custom date range on top of the phone Filters drawer and returns to it on close", async () => {
	const user = userEvent.setup();
	render(<DateFilterInGroup />);
	await user.click(screen.getByRole("button", { name: "Filters" }));
	const filtersDrawer = await screen.findByRole("dialog", { name: "Filters" });

	await user.click(within(filtersDrawer).getByRole("button", { name: "Custom date range" }));

	const dateRangeDialog = await screen.findByRole("dialog", { name: "Set date range" });
	expect(within(dateRangeDialog).getAllByRole("grid")).toHaveLength(1);
	expect(filtersDrawer).toBeInTheDocument();

	await user.click(
		within(dateRangeDialog).getByRole("button", { name: "Close set date range dialog" }),
	);

	await vi.waitFor(() =>
		expect(screen.queryByRole("dialog", { name: "Set date range" })).not.toBeInTheDocument(),
	);
	expect(screen.getByRole("dialog", { name: "Filters" })).toBeVisible();
});
