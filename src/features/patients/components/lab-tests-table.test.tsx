import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format, subDays } from "date-fns";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { LabTestType } from "@/features/patients/types";
import { LabTestsTable } from "./lab-tests-table";

const activeMember = vi.hoisted(() => ({ role: "owner" }));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: activeMember.role } }),
	},
}));

const labTests: LabTestType[] = [
	{
		test: "Hemoglobin A1c",
		testName: "Hemoglobin A1c",
		labId: "LAB-A1C",
		encounterId: "ENC-1",
		result: "6.1 %",
		specimen: "Whole blood",
		referenceRange: "4.0 - 5.6 %",
		interpretation: "Above the expected range",
		flag: "High",
		orderedAtValue: "2020-01-05",
		orderedAtLabel: "Jan 5, 2020",
		orderedAtSortValue: "2020-01-05T00:00:00.000Z",
		orderedBy: "Dr. Okafor",
		createdAtLabel: "Jan 6, 2020",
		createdAtSortValue: "2020-01-06T09:00:00.000Z",
		updatedAtLabel: "Jan 7, 2020",
		updatedAtSortValue: "2020-01-07T09:00:00.000Z",
		createdBy: "Nurse Ada",
		updatedBy: "Nurse Ada",
		status: "Completed",
		clinicalNote: "Repeat in three months.",
		files: [],
		history: [],
	},
	{
		test: "Basic Metabolic Panel",
		testName: "Basic Metabolic Panel",
		labId: "LAB-BMP",
		encounterId: "ENC-2",
		result: "-",
		specimen: "Serum",
		referenceRange: "-",
		interpretation: "Awaiting result",
		flag: "",
		orderedAtValue: "2020-01-01",
		orderedAtLabel: "Jan 1, 2020",
		orderedAtSortValue: "2020-01-01T00:00:00.000Z",
		orderedBy: "Dr. Bello",
		createdAtLabel: "Jan 2, 2020",
		createdAtSortValue: "2020-01-02T09:00:00.000Z",
		updatedAtLabel: "Jan 2, 2020",
		updatedAtSortValue: "2020-01-02T09:00:00.000Z",
		createdBy: "Nurse Ada",
		updatedBy: "Nurse Ada",
		status: "Pending",
		clinicalNote: "",
		files: [],
		history: [],
	},
];

function renderLabTestsTable(overrides: Partial<React.ComponentProps<typeof LabTestsTable>> = {}) {
	const props: React.ComponentProps<typeof LabTestsTable> = {
		patientId: "patient-a",
		labTests,
		page: 1,
		limit: 14,
		totalPages: 1,
		query: "",
		createdFrom: "",
		createdTo: "",
		statusFilters: [],
		flagFilters: [],
		isPending: false,
		onQueryChange: vi.fn(),
		onCreatedAtRangeApply: vi.fn(),
		onStatusFiltersChange: vi.fn(),
		onFlagFiltersChange: vi.fn(),
		onPreviousPage: vi.fn(),
		onNextPage: vi.fn(),
		onLimitChange: vi.fn(),
		...overrides,
	};

	render(<LabTestsTable {...props} />);

	return props;
}

function bodyRows() {
	return Array.from(screen.getByRole("table").querySelectorAll("tbody tr")) as HTMLElement[];
}

function displayedLabIds() {
	return bodyRows().map((row) => within(row).getAllByRole("cell")[2].textContent);
}

// jsdom has no layout, so the hover "grace area" Radix uses to keep a submenu
// open while the pointer travels into it closes the submenu on every simulated
// hover. Skipping the hover step keeps clicks inside submenus meaningful.
function setupSubmenuUser() {
	return userEvent.setup({ skipHover: true });
}

async function openFilterSubmenu(user: ReturnType<typeof userEvent.setup>, name: string) {
	await user.click(screen.getByRole("button", { name: "Filter" }));
	await user.click(await screen.findByRole("menuitem", { name }));
}

function bulkActionBar() {
	return screen.getByText(/items? selected/).parentElement as HTMLElement;
}

describe("Lab tests table", () => {
	beforeEach(() => {
		activeMember.role = "owner";
	});

	test("shows each lab test with its reference range, flag, creation date and status", () => {
		renderLabTestsTable();

		expect(screen.getByRole("heading", { name: "Lab Tests" })).toBeVisible();
		for (const label of ["Test", "Lab ID", "Reference Range", "Flag", "Created at", "Status"]) {
			expect(screen.getByRole("columnheader", { name: label })).toBeVisible();
		}
		expect(displayedLabIds()).toEqual(["LAB-A1C", "LAB-BMP"]);

		const [a1cRow, bmpRow] = bodyRows();
		expect(within(a1cRow).getByText("Hemoglobin A1c")).toBeVisible();
		expect(within(a1cRow).getByText("4.0 - 5.6 %")).toBeVisible();
		expect(within(a1cRow).getByText("High")).toBeVisible();
		expect(within(a1cRow).getByText("Jan 6, 2020")).toBeVisible();
		expect(within(a1cRow).getByText("Completed")).toBeVisible();

		expect(within(bmpRow).getByText("Awaiting result")).toBeVisible();
		expect(within(bmpRow).getByText("Pending")).toBeVisible();
		expect(within(bmpRow).getByRole("button", { name: "Copy LAB-BMP" })).toBeVisible();
	});

	test("shows the empty state when there are no lab tests", () => {
		renderLabTestsTable({ labTests: [] });

		expect(screen.getByText("No matching lab tests found.")).toBeVisible();
		expect(bodyRows()).toHaveLength(1);
	});

	test("reports what the user types in the search box and shows the controlled query", async () => {
		const user = userEvent.setup();
		const { onQueryChange } = renderLabTestsTable({ query: "Hemo" });

		const search = screen.getByRole("searchbox");
		expect(search).toHaveAttribute(
			"placeholder",
			"Search by test, result, lab ID, or encounter ID",
		);
		expect(search).toHaveValue("Hemo");
		await user.type(search, "g");
		expect(onQueryChange).toHaveBeenCalledWith("Hemog");
	});

	test("drops the encounter ID hint from the search box when scoped to an encounter", () => {
		renderLabTestsTable({ isEncounterScoped: true });

		expect(screen.getByRole("searchbox")).toHaveAttribute(
			"placeholder",
			"Search by test, result, or lab ID",
		);
	});

	test("sorts rows by test name when the header is clicked, then reverses, then clears", async () => {
		const user = userEvent.setup();
		renderLabTestsTable();

		const testHeader = screen.getByRole("columnheader", { name: "Test" });
		expect(testHeader).toHaveAttribute("aria-sort", "none");

		await user.click(testHeader);
		expect(testHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedLabIds()).toEqual(["LAB-BMP", "LAB-A1C"]);

		await user.click(testHeader);
		expect(testHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedLabIds()).toEqual(["LAB-A1C", "LAB-BMP"]);

		await user.click(testHeader);
		expect(testHeader).toHaveAttribute("aria-sort", "none");
		expect(displayedLabIds()).toEqual(["LAB-A1C", "LAB-BMP"]);
	});

	test("sorts by creation date chronologically using the keyboard", async () => {
		const user = userEvent.setup();
		renderLabTestsTable();

		const createdAtHeader = screen.getByRole("columnheader", { name: "Created at" });
		createdAtHeader.focus();
		await user.keyboard("{Enter}");
		expect(createdAtHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedLabIds()).toEqual(["LAB-BMP", "LAB-A1C"]);

		await user.keyboard(" ");
		expect(createdAtHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedLabIds()).toEqual(["LAB-A1C", "LAB-BMP"]);
	});

	test("does not offer sorting on the lab ID, reference range or status columns", () => {
		renderLabTestsTable();

		for (const label of ["Lab ID", "Reference Range", "Status"]) {
			expect(screen.getByRole("columnheader", { name: label })).not.toHaveAttribute("aria-sort");
		}
	});

	test("adds a status filter when its checkbox is ticked", async () => {
		const user = setupSubmenuUser();
		const { onStatusFiltersChange } = renderLabTestsTable({ statusFilters: ["completed"] });

		await openFilterSubmenu(user, "Status");

		expect(await screen.findByRole("checkbox", { name: "Completed" })).toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Cancelled" })).not.toBeChecked();
		await user.click(screen.getByRole("checkbox", { name: "Pending" }));
		expect(onStatusFiltersChange).toHaveBeenCalledWith(["completed", "pending"]);
	});

	test("removes a status filter when its checkbox is unticked", async () => {
		const user = setupSubmenuUser();
		const { onStatusFiltersChange } = renderLabTestsTable({ statusFilters: ["completed"] });

		await openFilterSubmenu(user, "Status");
		await user.click(await screen.findByRole("checkbox", { name: "Completed" }));
		expect(onStatusFiltersChange).toHaveBeenCalledWith([]);
	});

	test("offers every flag option and reports the chosen flags", async () => {
		const user = setupSubmenuUser();
		const { onFlagFiltersChange } = renderLabTestsTable({ flagFilters: ["high"] });

		await openFilterSubmenu(user, "Flag");

		const flagLabels = [
			"Within range",
			"Abnormal",
			"High",
			"Low",
			"Critical",
			"Pending",
			"Borderline",
			"Invalid",
			"Cancelled",
			"Inconclusive",
		];
		for (const label of flagLabels) {
			expect(await screen.findByRole("checkbox", { name: label })).toBeVisible();
		}
		expect(screen.getByRole("checkbox", { name: "High" })).toBeChecked();

		await user.click(screen.getByRole("checkbox", { name: "Critical" }));
		expect(onFlagFiltersChange).toHaveBeenCalledWith(["high", "critical"]);
	});

	test("disables the filter checkboxes while a request is pending", async () => {
		const user = setupSubmenuUser();
		renderLabTestsTable({ isPending: true });

		await openFilterSubmenu(user, "Status");
		expect(await screen.findByRole("checkbox", { name: "Pending" })).toBeDisabled();
	});

	test("applies a creation date preset as a from/to range", async () => {
		const user = setupSubmenuUser();
		const { onCreatedAtRangeApply } = renderLabTestsTable();

		await openFilterSubmenu(user, "Created at");
		await user.click(await screen.findByRole("menuitem", { name: "Last 7 days" }));

		const today = new Date();
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith(
			format(subDays(today, 6), "yyyy-MM-dd"),
			format(today, "yyyy-MM-dd"),
		);
	});

	test("applies a custom creation date range picked from the calendar", async () => {
		const user = setupSubmenuUser();
		const { onCreatedAtRangeApply } = renderLabTestsTable();

		await openFilterSubmenu(user, "Created at");
		const applyButton = await screen.findByRole("button", { name: "Apply" });
		expect(applyButton).toBeDisabled();

		const today = new Date();
		const start = new Date(today.getFullYear(), today.getMonth(), 10);
		const end = new Date(today.getFullYear(), today.getMonth(), 12);
		await user.click(
			screen.getByRole("button", { name: new RegExp(format(start, "MMMM do, yyyy")) }),
		);
		await user.click(
			screen.getByRole("button", { name: new RegExp(format(end, "MMMM do, yyyy")) }),
		);

		expect(screen.getByText(format(start, "dd/MM/yyyy"))).toBeVisible();
		expect(screen.getByText(format(end, "dd/MM/yyyy"))).toBeVisible();
		expect(applyButton).toBeEnabled();

		await user.click(applyButton);
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith(
			format(start, "yyyy-MM-dd"),
			format(end, "yyyy-MM-dd"),
		);
	});

	test("clears the creation date range from the calendar reset button", async () => {
		const user = setupSubmenuUser();
		const { onCreatedAtRangeApply } = renderLabTestsTable({
			createdFrom: "2020-01-01",
			createdTo: "2020-01-31",
		});

		await openFilterSubmenu(user, "Created at");
		expect(await screen.findByText("01/01/2020")).toBeVisible();
		expect(screen.getByText("31/01/2020")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Reset" }));
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith("", "");
	});

	test("shows active filters as pills that can be removed individually", async () => {
		const user = userEvent.setup();
		const { onCreatedAtRangeApply, onStatusFiltersChange, onFlagFiltersChange } =
			renderLabTestsTable({
				createdFrom: "2020-01-01",
				createdTo: "2020-01-31",
				statusFilters: ["pending", "completed"],
				flagFilters: ["within-range"],
			});

		expect(screen.getByText("Status: Pending")).toBeVisible();
		expect(screen.getByText("Status: Completed")).toBeVisible();
		expect(screen.getByText("Flag: Within Range")).toBeVisible();
		expect(screen.getByText("Created: Jan 1, 2020 - Jan 31, 2020")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Remove Status: Pending filter" }));
		expect(onStatusFiltersChange).toHaveBeenCalledWith(["completed"]);

		await user.click(screen.getByRole("button", { name: "Remove Flag: Within Range filter" }));
		expect(onFlagFiltersChange).toHaveBeenCalledWith([]);

		await user.click(
			screen.getByRole("button", { name: "Remove Created: Jan 1, 2020 - Jan 31, 2020 filter" }),
		);
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith("", "");
	});

	test("describes a one-sided date filter in the pill", () => {
		renderLabTestsTable({ createdFrom: "2020-01-01" });

		expect(screen.getByText("Created: From Jan 1, 2020")).toBeVisible();
	});

	test("shows no filter pills when no filter is active", () => {
		renderLabTestsTable();

		expect(screen.queryByRole("button", { name: /^Remove .* filter$/ })).not.toBeInTheDocument();
	});

	test("moves between pages through the callbacks", async () => {
		const user = userEvent.setup();
		const { onNextPage, onPreviousPage } = renderLabTestsTable({ page: 2, totalPages: 3 });

		expect(screen.getByText("Page 2 of 3")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Next" }));
		expect(onNextPage).toHaveBeenCalledTimes(1);
		await user.click(screen.getByRole("button", { name: "Previous" }));
		expect(onPreviousPage).toHaveBeenCalledTimes(1);
	});

	test("disables going back from the first page", () => {
		renderLabTestsTable({ page: 1, totalPages: 3 });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
	});

	test("disables going forward from the last page", () => {
		renderLabTestsTable({ page: 3, totalPages: 3 });

		expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	test("disables paging while a request is pending", () => {
		renderLabTestsTable({ page: 2, totalPages: 3, isPending: true });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	test("lets the user change the rows per page", async () => {
		const user = userEvent.setup();
		const { onLimitChange } = renderLabTestsTable({ limit: 14 });

		const rowsPerPage = screen.getByRole("combobox");
		expect(rowsPerPage).toHaveTextContent("14");
		await user.click(rowsPerPage);
		await user.click(await screen.findByRole("option", { name: "28" }));
		expect(onLimitChange).toHaveBeenCalledWith(28);
	});

	test("opens the details drawer for the row chosen from its action menu", async () => {
		const user = userEvent.setup();
		renderLabTestsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Hemoglobin A1c" }));
		await user.click(await screen.findByRole("menuitem", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "View details" });
		expect(within(dialog).getByRole("heading", { name: "Hemoglobin A1c" })).toBeVisible();
		expect(within(dialog).getByText("6.1 %")).toBeVisible();
		expect(within(dialog).getByText("Whole blood")).toBeVisible();
		expect(within(dialog).getByText("Dr. Okafor")).toBeVisible();
		expect(within(dialog).queryByText("Basic Metabolic Panel")).not.toBeInTheDocument();
	});

	test("opens the details drawer when the row itself is activated with the keyboard", async () => {
		const user = userEvent.setup();
		renderLabTestsTable();

		const [, bmpRow] = bodyRows();
		bmpRow.focus();
		await user.keyboard("{Enter}");

		const dialog = await screen.findByRole("dialog", { name: "View details" });
		expect(within(dialog).getByRole("heading", { name: "Basic Metabolic Panel" })).toBeVisible();
	});

	test("only offers status changes for pending lab tests", async () => {
		const user = userEvent.setup();
		renderLabTestsTable();

		await user.click(
			screen.getByRole("button", { name: "Open actions for Basic Metabolic Panel" }),
		);
		expect(await screen.findByRole("menuitem", { name: "Mark as completed" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Cancel" })).toBeVisible();
		await user.keyboard("{Escape}");

		await user.click(screen.getByRole("button", { name: "Open actions for Hemoglobin A1c" }));
		expect(await screen.findByRole("menuitem", { name: "Export" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Mark as completed" })).not.toBeInTheDocument();
		expect(screen.queryByRole("menuitem", { name: "Cancel" })).not.toBeInTheDocument();
	});

	test("opens the create drawer from the add button", async () => {
		const user = userEvent.setup();
		renderLabTestsTable();

		await user.click(screen.getByRole("button", { name: "Add lab test" }));
		expect(await screen.findByRole("dialog", { name: "Add lab test" })).toBeVisible();
	});

	test("shows archive actions to an owner", async () => {
		const user = userEvent.setup();
		renderLabTestsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Hemoglobin A1c" }));
		expect(await screen.findByRole("menuitem", { name: "Archive" })).toBeVisible();
		await user.keyboard("{Escape}");

		await user.click(screen.getAllByRole("checkbox")[1]);
		const bar = bulkActionBar();
		expect(within(bar).getByText("1 item selected")).toBeVisible();
		expect(within(bar).getByRole("button", { name: "Archive" })).toBeVisible();
	});

	test("shows archive actions to an admin", async () => {
		activeMember.role = "admin";
		const user = userEvent.setup();
		renderLabTestsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Hemoglobin A1c" }));
		expect(await screen.findByRole("menuitem", { name: "Archive" })).toBeVisible();
	});

	test("hides archive actions from a member", async () => {
		activeMember.role = "member";
		const user = userEvent.setup();
		renderLabTestsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Hemoglobin A1c" }));
		expect(await screen.findByRole("menuitem", { name: "View details" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Archive" })).not.toBeInTheDocument();
		await user.keyboard("{Escape}");

		await user.click(screen.getAllByRole("checkbox")[1]);
		const bar = bulkActionBar();
		expect(within(bar).getByText("1 item selected")).toBeVisible();
		expect(within(bar).getByRole("button", { name: "Export" })).toBeVisible();
		expect(within(bar).queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
	});

	test("selects rows for bulk actions and clears the selection", async () => {
		const user = userEvent.setup();
		renderLabTestsTable();

		const [selectAll, firstRow] = screen.getAllByRole("checkbox");
		await user.click(firstRow);
		expect(screen.getByText("1 item selected")).toBeVisible();
		expect(screen.getByRole("button", { name: "View details" })).toBeVisible();

		await user.click(selectAll);
		expect(screen.getByText("2 items selected")).toBeVisible();
		expect(screen.queryByRole("button", { name: "View details" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Archive all" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Clear selected lab tests" }));
		expect(screen.queryByText(/items? selected/)).not.toBeInTheDocument();
	});

	test("opens the details drawer for a single selected row from the bulk bar", async () => {
		const user = userEvent.setup();
		renderLabTestsTable();

		await user.click(screen.getAllByRole("checkbox")[2]);
		await user.click(screen.getByRole("button", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "View details" });
		expect(within(dialog).getByRole("heading", { name: "Basic Metabolic Panel" })).toBeVisible();
	});
});
