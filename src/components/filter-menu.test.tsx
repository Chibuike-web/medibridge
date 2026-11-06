import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RiCalendarLine, RiCheckboxCircleLine } from "@remixicon/react";
import { useState } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { SetDateRangeDialog, type DateRangeFilter } from "./date-range-filter";
import { DateFilterMenu, FilterGroup, FilterPopover } from "./filter-menu";

function DateFilterInGroup() {
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);

	return (
		<>
			<FilterGroup activeFilterCount={0}>
				<DateFilterMenu
					label="Created at"
					icon={RiCalendarLine}
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

let isPhoneWidth = true;
let widthChangeListeners: (() => void)[] = [];

function setPhoneWidth(isPhone: boolean) {
	act(() => {
		isPhoneWidth = isPhone;
		for (const listener of widthChangeListeners) listener();
	});
}

beforeEach(() => {
	isPhoneWidth = true;
	widthChangeListeners = [];
	vi.stubGlobal("matchMedia", () => ({
		matches: isPhoneWidth,
		addEventListener: (_event: string, listener: () => void) => widthChangeListeners.push(listener),
		removeEventListener: vi.fn(),
	}));
});

test("stays closed after the screen widens and shrinks back to phone width", async () => {
	const user = userEvent.setup();
	render(
		<FilterGroup activeFilterCount={0}>
			<FilterPopover label="Status" icon={RiCheckboxCircleLine}>
				<p>Status options</p>
			</FilterPopover>
		</FilterGroup>,
	);
	await user.click(screen.getByRole("button", { name: "Filters" }));
	expect(await screen.findByRole("dialog", { name: "Filters" })).toBeVisible();

	setPhoneWidth(false);
	expect(screen.getByRole("button", { name: "Status" })).toBeVisible();

	setPhoneWidth(true);

	expect(screen.getByRole("button", { name: "Filters" })).toBeVisible();
	await vi.waitFor(() =>
		expect(screen.queryByRole("dialog", { name: "Filters" })).not.toBeInTheDocument(),
	);
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
