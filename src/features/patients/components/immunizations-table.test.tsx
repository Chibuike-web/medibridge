import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format, setDate, startOfMonth, subDays } from "date-fns";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ImmunizationDetailsType, ImmunizationType } from "@/features/patients/types";
import { ImmunizationsTable } from "./immunizations-table";

const authState = vi.hoisted(() => ({ role: "owner" }));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: authState.role } }),
	},
}));

const immunizations: ImmunizationType[] = [
	{
		vaccineName: "Tetanus toxoid",
		immunizationId: "IMM-3001",
		dose: "Dose 2 of 3",
		createdAtLabel: "Mar 5, 2024",
		createdAtSortValue: "2024-03-05",
		status: "Active",
	},
	{
		vaccineName: "Hepatitis B",
		immunizationId: "IMM-1001",
		dose: "Dose 3 of 3",
		createdAtLabel: "Jan 12, 2024",
		createdAtSortValue: "2024-01-12",
		status: "Completed",
	},
];

const immunizationDetailsById: Record<string, ImmunizationDetailsType> = {
	"IMM-1001": {
		immunizationId: "IMM-1001",
		encounterId: "ENC-1001",
		vaccineName: "Hepatitis B",
		seriesType: "Primary series",
		currentDose: "3",
		totalDoses: "3",
		status: "Completed",
		dateAdministered: "Jan 12, 2024",
		administeredBy: "Nurse Ada Eze",
		createdAt: "Jan 12, 2024",
		updatedAt: "Jan 12, 2024",
		createdBy: "Dr. Bello",
		updatedBy: "Dr. Bello",
		clinicalNote: "No adverse reaction observed.",
		history: [],
	},
	"IMM-3001": {
		immunizationId: "IMM-3001",
		encounterId: null,
		vaccineName: "Tetanus toxoid",
		seriesType: "Booster",
		currentDose: "2",
		totalDoses: "3",
		status: "Active",
		dateAdministered: "Mar 5, 2024",
		administeredBy: "Nurse Kemi Ojo",
		createdAt: "Mar 5, 2024",
		updatedAt: "Mar 5, 2024",
		createdBy: "Dr. Okafor",
		updatedBy: "Dr. Okafor",
		clinicalNote: "",
		history: [],
	},
};

function renderImmunizationsTable(
	overrides: Partial<React.ComponentProps<typeof ImmunizationsTable>> = {},
) {
	const props: React.ComponentProps<typeof ImmunizationsTable> = {
		immunizations,
		page: 1,
		limit: 14,
		totalPages: 1,
		query: "",
		createdFrom: "",
		createdTo: "",
		statusFilters: [],
		isPending: false,
		onQueryChange: vi.fn(),
		onCreatedAtRangeApply: vi.fn(),
		onStatusFiltersChange: vi.fn(),
		onPreviousPage: vi.fn(),
		onNextPage: vi.fn(),
		onLimitChange: vi.fn(),
		...overrides,
	};

	render(
		<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
			<ImmunizationsTable {...props} />
		</SWRConfig>,
	);

	return props;
}

function bodyRows() {
	return Array.from(screen.getByRole("table").querySelectorAll("tbody tr")) as HTMLElement[];
}

function displayedIds() {
	return bodyRows().map((row) => within(row).getAllByRole("cell")[2].textContent);
}

function rowsPerPagePicker() {
	return within(screen.getByText("Rows per page").parentElement as HTMLElement).getByRole(
		"combobox",
	);
}

// Controls inside a filter submenu are clicked without a pointer move: jsdom has no
// layout, so the menu's "pointer is heading toward the submenu" check fails and the
// submenu dismisses before a userEvent click (which moves the pointer first) lands.
function clickInSubmenu(element: HTMLElement) {
	fireEvent.click(element);
}

async function openFilterSubmenu(user: ReturnType<typeof userEvent.setup>, label: string) {
	await user.click(screen.getByRole("button", { name: "Filter" }));
	await user.click(screen.getByRole("menuitem", { name: label }));
}

function calendarDay(date: Date) {
	return screen.getByRole("button", { name: new RegExp(format(date, "MMMM do, yyyy")) });
}

describe("Immunizations table", () => {
	beforeEach(() => {
		authState.role = "owner";
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: string) => {
				const immunizationId = decodeURIComponent(input.split("/").pop() ?? "");
				return {
					ok: true,
					json: async () => ({
						immunization: immunizationDetailsById[immunizationId] ?? null,
					}),
				};
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("shows each immunization's vaccine, ID, dose, creation date and status", () => {
		renderImmunizationsTable();

		for (const label of ["Vaccine name", "Immunization ID", "Dose", "Created At", "Status"]) {
			expect(screen.getByRole("columnheader", { name: label })).toBeVisible();
		}

		const [firstRow, secondRow] = bodyRows();
		expect(within(firstRow).getByText("Tetanus toxoid")).toBeVisible();
		expect(within(firstRow).getByRole("button", { name: "Copy IMM-3001" })).toBeVisible();
		expect(within(firstRow).getByText("Dose 2 of 3")).toBeVisible();
		expect(within(firstRow).getByText("Mar 5, 2024")).toBeVisible();
		expect(within(firstRow).getByText("Active")).toBeVisible();

		expect(within(secondRow).getByText("Hepatitis B")).toBeVisible();
		expect(within(secondRow).getByText("Dose 3 of 3")).toBeVisible();
		expect(within(secondRow).getByText("Jan 12, 2024")).toBeVisible();
		expect(within(secondRow).getByText("Completed")).toBeVisible();
	});

	it("shows an empty message when there are no immunizations", () => {
		renderImmunizationsTable({ immunizations: [] });

		expect(screen.getByText("No matching immunizations found.")).toBeVisible();
		expect(bodyRows()).toHaveLength(1);
	});

	it("reports what the user types in the search box", async () => {
		const user = userEvent.setup();
		const { onQueryChange } = renderImmunizationsTable({ query: "Hep" });

		const search = screen.getByRole("searchbox");
		expect(search).toHaveAttribute(
			"placeholder",
			"Search by vaccine name, immunization ID, or encounter ID",
		);
		expect(search).toHaveValue("Hep");
		await user.type(search, "a");
		expect(onQueryChange).toHaveBeenCalledWith("Hepa");
	});

	it("drops encounter ID from the search hint when scoped to an encounter", () => {
		renderImmunizationsTable({ isEncounterScoped: true });

		expect(screen.getByRole("searchbox")).toHaveAttribute(
			"placeholder",
			"Search by vaccine name or immunization ID",
		);
	});

	it("re-orders rows when the user sorts by vaccine name", async () => {
		const user = userEvent.setup();
		renderImmunizationsTable();

		expect(displayedIds()).toEqual(["IMM-3001", "IMM-1001"]);

		const vaccineHeader = screen.getByRole("columnheader", { name: "Vaccine name" });
		await user.click(vaccineHeader);
		expect(vaccineHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedIds()).toEqual(["IMM-1001", "IMM-3001"]);

		await user.click(vaccineHeader);
		expect(vaccineHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedIds()).toEqual(["IMM-3001", "IMM-1001"]);
	});

	it("sorts by creation date from the keyboard", async () => {
		const user = userEvent.setup();
		renderImmunizationsTable();

		const createdHeader = screen.getByRole("columnheader", { name: "Created At" });
		createdHeader.focus();
		await user.keyboard("{Enter}");
		expect(createdHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedIds()).toEqual(["IMM-1001", "IMM-3001"]);
		await user.keyboard(" ");
		expect(createdHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedIds()).toEqual(["IMM-3001", "IMM-1001"]);
	});

	it("does not allow sorting by immunization ID, dose or status", () => {
		renderImmunizationsTable();

		for (const label of ["Immunization ID", "Dose", "Status"]) {
			expect(screen.getByRole("columnheader", { name: label })).not.toHaveAttribute("aria-sort");
		}
	});

	it("lists status and created-at filters", async () => {
		const user = userEvent.setup();
		renderImmunizationsTable();

		await user.click(screen.getByRole("button", { name: "Filter" }));

		expect(screen.getByRole("menuitem", { name: "Status" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Created at" })).toBeVisible();
	});

	it("adds and removes status filters from the Status submenu", async () => {
		const user = userEvent.setup();
		const { onStatusFiltersChange } = renderImmunizationsTable({ statusFilters: ["active"] });

		await openFilterSubmenu(user, "Status");

		const active = await screen.findByRole("checkbox", { name: "Active" });
		expect(active).toBeChecked();
		for (const label of ["Completed", "Cancelled", "Discontinued"]) {
			expect(screen.getByRole("checkbox", { name: label })).not.toBeChecked();
		}

		clickInSubmenu(screen.getByRole("checkbox", { name: "Discontinued" }));
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith(["active", "discontinued"]);

		clickInSubmenu(active);
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith([]);
	});

	it("applies a created-at preset as a from/to range", async () => {
		const user = userEvent.setup();
		const { onCreatedAtRangeApply } = renderImmunizationsTable();

		await openFilterSubmenu(user, "Created at");
		clickInSubmenu(await screen.findByRole("menuitem", { name: "Last 30 days" }));

		const today = new Date();
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith(
			format(subDays(today, 29), "yyyy-MM-dd"),
			format(today, "yyyy-MM-dd"),
		);
	});

	it("applies a custom created-at range picked on the calendar and can reset it", async () => {
		const user = userEvent.setup();
		const { onCreatedAtRangeApply } = renderImmunizationsTable();

		await openFilterSubmenu(user, "Created at");

		const applyButton = await screen.findByRole("button", { name: "Apply" });
		expect(applyButton).toBeDisabled();

		const rangeStart = setDate(startOfMonth(new Date()), 3);
		const rangeEnd = setDate(startOfMonth(new Date()), 5);
		clickInSubmenu(calendarDay(rangeStart));
		clickInSubmenu(calendarDay(rangeEnd));

		expect(screen.getByText(format(rangeStart, "dd/MM/yyyy"))).toBeVisible();
		expect(screen.getByText(format(rangeEnd, "dd/MM/yyyy"))).toBeVisible();
		expect(applyButton).toBeEnabled();

		clickInSubmenu(applyButton);
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith(
			format(rangeStart, "yyyy-MM-dd"),
			format(rangeEnd, "yyyy-MM-dd"),
		);

		clickInSubmenu(screen.getByRole("button", { name: "Reset" }));
		expect(onCreatedAtRangeApply).toHaveBeenLastCalledWith("", "");
	});

	it("shows active filters as pills the user can remove", async () => {
		const user = userEvent.setup();
		const { onStatusFiltersChange, onCreatedAtRangeApply } = renderImmunizationsTable({
			statusFilters: ["active", "discontinued"],
			createdFrom: "2024-01-01",
			createdTo: "2024-01-31",
		});

		expect(screen.getByText("Status: Active")).toBeVisible();
		expect(screen.getByText("Status: Discontinued")).toBeVisible();
		expect(screen.getByText("Created: Jan 1, 2024 - Jan 31, 2024")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Remove Status: Discontinued filter" }));
		expect(onStatusFiltersChange).toHaveBeenCalledWith(["active"]);

		await user.click(screen.getByRole("button", { name: /Remove Created:/ }));
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith("", "");
	});

	it("shows no filter pills when no filters are active", () => {
		renderImmunizationsTable();

		expect(screen.queryByRole("button", { name: /^Remove / })).not.toBeInTheDocument();
	});

	it("paginates through the owner callbacks and shows the current page", async () => {
		const user = userEvent.setup();
		const { onNextPage, onPreviousPage } = renderImmunizationsTable({ page: 3, totalPages: 5 });

		expect(screen.getByText("Page 3 of 5")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Next" }));
		expect(onNextPage).toHaveBeenCalledTimes(1);
		await user.click(screen.getByRole("button", { name: "Previous" }));
		expect(onPreviousPage).toHaveBeenCalledTimes(1);
	});

	it("disables Previous on the first page and Next on the last page", () => {
		renderImmunizationsTable({ page: 1, totalPages: 1 });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	it("disables paging and the rows-per-page picker while a request is pending", () => {
		renderImmunizationsTable({ page: 2, totalPages: 3, isPending: true });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
		expect(rowsPerPagePicker()).toBeDisabled();
	});

	it("lets the user change the rows per page", async () => {
		const user = userEvent.setup();
		const { onLimitChange } = renderImmunizationsTable();

		const picker = rowsPerPagePicker();
		expect(picker).toHaveTextContent("14");
		await user.click(picker);
		await user.click(await screen.findByRole("option", { name: "42" }));
		expect(onLimitChange).toHaveBeenCalledWith(42);
	});

	it("opens the details drawer with that immunization's data from the row actions", async () => {
		const user = userEvent.setup();
		renderImmunizationsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Hepatitis B" }));
		expect(await screen.findByRole("menuitem", { name: "Export" })).toBeVisible();
		await user.click(screen.getByRole("menuitem", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "View immunization details" });
		expect(await within(dialog).findByRole("heading", { name: "Hepatitis B" })).toBeVisible();
		expect(within(dialog).getByText("Primary series")).toBeVisible();
		expect(within(dialog).getByText("Nurse Ada Eze")).toBeVisible();
		expect(within(dialog).getByText("No adverse reaction observed.")).toBeVisible();
		expect(within(dialog).getByRole("button", { name: "Copy ENC-1001" })).toBeVisible();
	});

	it("opens the details drawer when a row is activated from the keyboard", async () => {
		const user = userEvent.setup();
		renderImmunizationsTable();

		const [firstRow] = bodyRows();
		firstRow.focus();
		await user.keyboard("{Enter}");

		const dialog = await screen.findByRole("dialog", { name: "View immunization details" });
		expect(await within(dialog).findByRole("heading", { name: "Tetanus toxoid" })).toBeVisible();
		expect(within(dialog).getByText("Booster")).toBeVisible();
		expect(within(dialog).getByText("Nurse Kemi Ojo")).toBeVisible();
	});

	it("only offers status changes on active immunizations", async () => {
		const user = userEvent.setup();
		renderImmunizationsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Tetanus toxoid" }));
		expect(await screen.findByRole("menuitem", { name: "Mark as completed" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Discontinue" })).toBeVisible();
		await user.keyboard("{Escape}");

		await user.click(screen.getByRole("button", { name: "Open actions for Hepatitis B" }));
		expect(await screen.findByRole("menuitem", { name: "View details" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Mark as completed" })).not.toBeInTheDocument();
		expect(screen.queryByRole("menuitem", { name: "Discontinue" })).not.toBeInTheDocument();
	});

	it("offers Archive to an admin in the row actions and the bulk bar", async () => {
		authState.role = "admin";
		const user = userEvent.setup();
		renderImmunizationsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Hepatitis B" }));
		expect(await screen.findByRole("menuitem", { name: "Archive" })).toBeVisible();
		await user.keyboard("{Escape}");

		const [firstRow, secondRow] = bodyRows();
		await user.click(within(firstRow).getByRole("checkbox"));
		expect(screen.getByText("1 item selected")).toBeVisible();
		expect(screen.getByRole("button", { name: "Archive" })).toBeVisible();

		await user.click(within(secondRow).getByRole("checkbox"));
		expect(screen.getByText("2 items selected")).toBeVisible();
		expect(screen.getByRole("button", { name: "Archive all" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Clear selected immunizations" }));
		expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
	});

	it("hides Archive from a member in the row actions and the bulk bar", async () => {
		authState.role = "member";
		const user = userEvent.setup();
		renderImmunizationsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Hepatitis B" }));
		expect(await screen.findByRole("menuitem", { name: "View details" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Archive" })).not.toBeInTheDocument();
		await user.keyboard("{Escape}");

		const [firstRow] = bodyRows();
		await user.click(within(firstRow).getByRole("checkbox"));
		expect(screen.getByText("1 item selected")).toBeVisible();
		expect(screen.queryByRole("button", { name: /Archive/ })).not.toBeInTheDocument();
	});

	it("opens the selected immunization's details from the bulk bar", async () => {
		const user = userEvent.setup();
		renderImmunizationsTable();

		const [, secondRow] = bodyRows();
		await user.click(within(secondRow).getByRole("checkbox"));
		await user.click(screen.getByRole("button", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "View immunization details" });
		expect(await within(dialog).findByRole("heading", { name: "Hepatitis B" })).toBeVisible();
	});

	it("opens the add immunization drawer from the Add immunization button", async () => {
		const user = userEvent.setup();
		renderImmunizationsTable();

		await user.click(screen.getByRole("button", { name: "Add immunization" }));

		expect(await screen.findByRole("dialog", { name: "Add immunization" })).toBeVisible();
	});
});
