import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDays, format, subDays, subMonths } from "date-fns";
import { describe, expect, test, vi } from "vitest";
import { DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { DateRangeMenuItems, SetDateRangeDialog } from "./date-range-filter";

function renderMenuItems(from = "", to = "") {
	const onDateRangeApply = vi.fn();
	const onCustomDateRangeSelect = vi.fn();
	render(
		<DropdownMenu open>
			<DropdownMenuContent>
				<DateRangeMenuItems
					from={from}
					to={to}
					onDateRangeApply={onDateRangeApply}
					onCustomDateRangeSelect={onCustomDateRangeSelect}
				/>
			</DropdownMenuContent>
		</DropdownMenu>,
	);
	return { onDateRangeApply, onCustomDateRangeSelect };
}

function shownMonths(dialog: HTMLElement) {
	const months = within(dialog).getAllByRole("combobox", { name: "Choose the Month" });
	const years = within(dialog).getAllByRole("combobox", { name: "Choose the Year" });
	return months.map((month, index) => `${month.textContent} ${years[index].textContent}`);
}

describe("date range filter", () => {
	test("applies a preset range that ends today", async () => {
		const user = userEvent.setup();
		const { onDateRangeApply } = renderMenuItems();

		await user.click(screen.getByRole("menuitem", { name: "Last 7 days" }));

		const today = new Date();
		expect(onDateRangeApply).toHaveBeenCalledWith(
			format(subDays(today, 6), "yyyy-MM-dd"),
			format(today, "yyyy-MM-dd"),
		);
	});

	test("marks the preset that matches the applied range", () => {
		const today = new Date();
		renderMenuItems(format(subDays(today, 29), "yyyy-MM-dd"), format(today, "yyyy-MM-dd"));

		expect(
			within(screen.getByRole("menuitem", { name: /Last 30 days/ })).getByLabelText("Selected"),
		).toBeVisible();
		expect(
			within(screen.getByRole("menuitem", { name: /Last 7 days/ })).queryByLabelText("Selected"),
		).not.toBeInTheDocument();
	});

	test("hands the current range to the custom date range dialog", async () => {
		const user = userEvent.setup();
		const { onDateRangeApply, onCustomDateRangeSelect } = renderMenuItems(
			"2026-01-01",
			"2026-01-31",
		);

		await user.click(screen.getByRole("menuitem", { name: "Custom date range" }));

		expect(onCustomDateRangeSelect).toHaveBeenCalledWith({
			from: "2026-01-01",
			to: "2026-01-31",
			onDateRangeApply,
		});
		expect(onDateRangeApply).not.toHaveBeenCalled();
	});

	test.each([
		{ range: "within last month", startMonthOffset: -1, endMonthOffset: -1 },
		{ range: "within this month", startMonthOffset: 0, endMonthOffset: 0 },
		{ range: "from last month into this month", startMonthOffset: -1, endMonthOffset: 0 },
	])("applies a range $range", async ({ startMonthOffset, endMonthOffset }) => {
		const user = userEvent.setup();
		const today = new Date();
		const start = new Date(today.getFullYear(), today.getMonth() + startMonthOffset, 1);
		const end = new Date(today.getFullYear(), today.getMonth() + endMonthOffset, 1);
		const onDateRangeApply = vi.fn();
		render(
			<SetDateRangeDialog
				dateRangeFilter={{ from: "", to: "", onDateRangeApply }}
				onClose={vi.fn()}
			/>,
		);
		const dialog = screen.getByRole("dialog", { name: "Set date range" });
		expect(shownMonths(dialog)).toEqual([
			format(subMonths(today, 1), "MMMM yyyy"),
			format(today, "MMMM yyyy"),
		]);

		await user.click(
			within(dialog).getByRole("button", { name: new RegExp(format(start, "MMMM do, yyyy")) }),
		);
		await user.click(
			within(dialog).getByRole("button", {
				name: new RegExp(format(addDays(end, 1), "MMMM do, yyyy")),
			}),
		);
		await user.click(within(dialog).getByRole("button", { name: "Apply date range" }));

		expect(onDateRangeApply).toHaveBeenCalledWith(
			format(start, "yyyy-MM-dd"),
			format(addDays(end, 1), "yyyy-MM-dd"),
		);
	});

	test("clears the current range with Reset and keeps the dialog open", async () => {
		const user = userEvent.setup();
		const onDateRangeApply = vi.fn();
		const onClose = vi.fn();
		render(
			<SetDateRangeDialog
				dateRangeFilter={{ from: "2020-01-01", to: "2020-01-31", onDateRangeApply }}
				onClose={onClose}
			/>,
		);
		const dialog = screen.getByRole("dialog", { name: "Set date range" });
		expect(within(dialog).getByText("1st January, 2020")).toBeVisible();
		expect(within(dialog).getByText("31st January, 2020")).toBeVisible();

		await user.click(within(dialog).getByRole("button", { name: "Reset" }));

		expect(onDateRangeApply).toHaveBeenLastCalledWith("", "");
		expect(within(dialog).queryByText("1st January, 2020")).not.toBeInTheDocument();
		expect(within(dialog).queryByText("31st January, 2020")).not.toBeInTheDocument();
		expect(screen.getByRole("dialog", { name: "Set date range" })).toBeVisible();
		expect(onClose).not.toHaveBeenCalled();
	});

	test("applies the chosen start and end dates and closes", async () => {
		const user = userEvent.setup();
		const today = new Date();
		const start = new Date(today.getFullYear(), today.getMonth() - 1, 15);
		const end = new Date(today.getFullYear(), today.getMonth(), 15);
		const onDateRangeApply = vi.fn();
		const onClose = vi.fn();
		render(
			<SetDateRangeDialog
				dateRangeFilter={{ from: "", to: "", onDateRangeApply }}
				onClose={onClose}
			/>,
		);
		const dialog = screen.getByRole("dialog", { name: "Set date range" });
		const apply = within(dialog).getByRole("button", { name: "Apply date range" });
		expect(apply).toBeDisabled();

		await user.click(
			within(dialog).getByRole("button", { name: new RegExp(format(start, "MMMM do, yyyy")) }),
		);
		await user.click(
			within(dialog).getByRole("button", { name: new RegExp(format(end, "MMMM do, yyyy")) }),
		);
		await user.click(apply);

		expect(onDateRangeApply).toHaveBeenCalledWith(
			format(start, "yyyy-MM-dd"),
			format(end, "yyyy-MM-dd"),
		);
		expect(onClose).toHaveBeenCalled();
	});
});
