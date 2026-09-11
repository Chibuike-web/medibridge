import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDays, format, startOfMonth, subDays } from "date-fns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AllergyDetailsType, AllergyType } from "@/features/patients/types";
import { AllergiesTable } from "./allergies-table";

const auth = vi.hoisted(() => ({ role: "owner" }));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: auth.role } }),
	},
}));

const allergies: AllergyType[] = [
	{
		allergen: "Peanuts",
		allergyId: "AL-peanut",
		reaction: "Anaphylaxis",
		createdAtLabel: "Mar 3, 2021",
		createdAtSortValue: "2021-03-03",
		severity: "Severe",
		status: "Active",
	},
	{
		allergen: "Latex",
		allergyId: "AL-latex",
		reaction: "Rash",
		createdAtLabel: "Jan 9, 2020",
		createdAtSortValue: "2020-01-09",
		severity: "Mild",
		status: "Inactive",
	},
];

const allergyDetails: Record<string, AllergyDetailsType> = {
	"AL-peanut": {
		allergyId: "AL-peanut",
		encounterId: "ENC-1",
		allergen: "Peanuts",
		reaction: "Anaphylaxis within minutes",
		severity: "Severe",
		status: "Active",
		createdAt: "Mar 3, 2021",
		updatedAt: "Mar 10, 2021",
		createdBy: "Dr. Okafor",
		updatedBy: "Dr. Bello",
		clinicalNote: "Carries an epinephrine auto-injector.",
		history: [],
	},
	"AL-latex": {
		allergyId: "AL-latex",
		encounterId: null,
		allergen: "Latex",
		reaction: "Contact rash on hands",
		severity: "Mild",
		status: "Inactive",
		createdAt: "Jan 9, 2020",
		updatedAt: "Feb 2, 2020",
		createdBy: "Nurse Chika",
		updatedBy: "Dr. Adeyemi",
		clinicalNote: "Avoid latex gloves.",
		history: [],
	},
};

type AllergiesTableProps = React.ComponentProps<typeof AllergiesTable>;

function buildProps(overrides: Partial<AllergiesTableProps> = {}): AllergiesTableProps {
	return {
		allergies,
		page: 1,
		limit: 14,
		totalPages: 1,
		query: "",
		createdFrom: "",
		createdTo: "",
		statusFilters: [],
		severityFilters: [],
		isPending: false,
		onQueryChange: vi.fn(),
		onCreatedAtRangeApply: vi.fn(),
		onStatusFiltersChange: vi.fn(),
		onSeverityFiltersChange: vi.fn(),
		onPreviousPage: vi.fn(),
		onNextPage: vi.fn(),
		onLimitChange: vi.fn(),
		...overrides,
	};
}

function renderAllergiesTable(overrides: Partial<AllergiesTableProps> = {}) {
	const props = buildProps(overrides);

	render(<AllergiesTable {...props} />);

	return props;
}

function displayedAllergens() {
	return Array.from(screen.getByRole("table").querySelectorAll("tbody tr")).map(
		(row) => within(row as HTMLElement).getAllByRole("cell")[1].textContent,
	);
}

function rowFor(allergen: string) {
	return screen.getByText(allergen).closest("tr") as HTMLElement;
}

function urlDate(date: Date) {
	return format(date, "yyyy-MM-dd");
}

function dayButtonName(date: Date) {
	return new RegExp(format(date, "EEEE, MMMM do, yyyy"));
}

type User = ReturnType<typeof userEvent.setup>;

async function openFilterSubmenu(user: User, name: string) {
	await user.click(screen.getByRole("button", { name: "Filter" }));
	await user.click(screen.getByRole("menuitem", { name }));
}

// jsdom has no layout, so a mouse move from a submenu trigger into its content reads as the
// pointer leaving the menu and the submenu closes. A tap has no move phase, so it behaves like
// a real click inside the submenu.
async function tap(user: User, target: Element) {
	await user.pointer({ keys: "[TouchA]", target });
}

describe("Allergies table", () => {
	beforeEach(() => {
		auth.role = "owner";
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: RequestInfo | URL) => {
				const id = decodeURIComponent(String(input).split("/").pop() ?? "");
				return {
					ok: true,
					json: async () => ({ allergy: allergyDetails[id] ?? null }),
				} as Response;
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("lists allergies in the supplied order with reaction, date, severity and status", () => {
		renderAllergiesTable();

		expect(screen.getByRole("heading", { name: "Allergies" })).toBeVisible();
		for (const header of [
			"Allergen",
			"Allergy ID",
			"Reaction",
			"Created at",
			"Severity",
			"Status",
		]) {
			expect(screen.getByRole("columnheader", { name: header })).toBeVisible();
		}

		expect(displayedAllergens()).toEqual(["Peanuts", "Latex"]);

		const peanutRow = rowFor("Peanuts");
		expect(within(peanutRow).getByRole("cell", { name: "Anaphylaxis" })).toBeVisible();
		expect(within(peanutRow).getByRole("cell", { name: "Mar 3, 2021" })).toBeVisible();
		expect(within(peanutRow).getByRole("cell", { name: "Severe" })).toBeVisible();
		expect(within(peanutRow).getByRole("button", { name: "Copy AL-peanut" })).toBeVisible();
		expect(within(peanutRow).getByText("Active")).toBeVisible();

		const latexRow = rowFor("Latex");
		expect(within(latexRow).getByRole("cell", { name: "Rash" })).toBeVisible();
		expect(within(latexRow).getByRole("cell", { name: "Mild" })).toBeVisible();
		expect(within(latexRow).getByText("Inactive")).toBeVisible();
	});

	it("re-orders rows when a sortable header is clicked", async () => {
		const user = userEvent.setup();
		renderAllergiesTable();

		const allergenHeader = screen.getByRole("columnheader", { name: "Allergen" });
		expect(allergenHeader).toHaveAttribute("aria-sort", "none");
		await user.click(allergenHeader);
		expect(allergenHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedAllergens()).toEqual(["Latex", "Peanuts"]);
		await user.click(allergenHeader);
		expect(allergenHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedAllergens()).toEqual(["Peanuts", "Latex"]);

		const createdHeader = screen.getByRole("columnheader", { name: "Created at" });
		await user.click(createdHeader);
		expect(createdHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedAllergens()).toEqual(["Latex", "Peanuts"]);

		const severityHeader = screen.getByRole("columnheader", { name: "Severity" });
		await user.click(severityHeader);
		expect(severityHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedAllergens()).toEqual(["Latex", "Peanuts"]);

		expect(screen.getByRole("columnheader", { name: "Reaction" })).not.toHaveAttribute("aria-sort");
	});

	it("reports what the user types in the search box", async () => {
		const user = userEvent.setup();
		const { onQueryChange } = renderAllergiesTable({ query: "Pea" });

		const search = screen.getByRole("searchbox");
		expect(search).toHaveAttribute(
			"placeholder",
			"Search by allergen, reaction, severity, allergy ID, or encounter ID",
		);
		expect(search).toHaveValue("Pea");
		await user.type(search, "n");
		expect(onQueryChange).toHaveBeenCalledWith("Pean");
	});

	it("drops the encounter ID hint from the search box when scoped to an encounter", () => {
		renderAllergiesTable({ isEncounterScoped: true });

		expect(screen.getByRole("searchbox")).toHaveAttribute(
			"placeholder",
			"Search by allergen, reaction, severity, or allergy ID",
		);
	});

	it("adds and removes status filters from the filter menu", async () => {
		const user = userEvent.setup();
		const { onStatusFiltersChange } = renderAllergiesTable({ statusFilters: ["active"] });

		await openFilterSubmenu(user, "Status");

		const activeOption = await screen.findByRole("checkbox", { name: "Active" });
		const inactiveOption = screen.getByRole("checkbox", { name: "Inactive" });
		expect(activeOption).toBeChecked();
		expect(inactiveOption).not.toBeChecked();

		await tap(user, inactiveOption);
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith(["active", "inactive"]);

		await tap(user, activeOption);
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith([]);
	});

	it("adds and removes severity filters from the filter menu", async () => {
		const user = userEvent.setup();
		const { onSeverityFiltersChange } = renderAllergiesTable({ severityFilters: ["mild"] });

		await openFilterSubmenu(user, "Severity");

		const mildOption = await screen.findByRole("checkbox", { name: "Mild" });
		expect(mildOption).toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Moderate" })).not.toBeChecked();

		await tap(user, screen.getByRole("checkbox", { name: "Severe" }));
		expect(onSeverityFiltersChange).toHaveBeenLastCalledWith(["mild", "severe"]);

		await tap(user, mildOption);
		expect(onSeverityFiltersChange).toHaveBeenLastCalledWith([]);
	});

	it("applies created-at date presets", async () => {
		const user = userEvent.setup();
		const today = new Date();
		const { onCreatedAtRangeApply } = renderAllergiesTable();

		await openFilterSubmenu(user, "Created at");
		await tap(user, await screen.findByRole("menuitem", { name: "Today" }));
		expect(onCreatedAtRangeApply).toHaveBeenLastCalledWith(urlDate(today), urlDate(today));

		await tap(user, screen.getByRole("menuitem", { name: "Last 7 days" }));
		expect(onCreatedAtRangeApply).toHaveBeenLastCalledWith(
			urlDate(subDays(today, 6)),
			urlDate(today),
		);

		await tap(user, screen.getByRole("menuitem", { name: "Last 30 days" }));
		expect(onCreatedAtRangeApply).toHaveBeenLastCalledWith(
			urlDate(subDays(today, 29)),
			urlDate(today),
		);
	});

	it("applies a custom calendar range and can reset it", async () => {
		const user = userEvent.setup();
		const firstOfMonth = startOfMonth(new Date());
		const thirdOfMonth = addDays(firstOfMonth, 2);
		const { onCreatedAtRangeApply } = renderAllergiesTable();

		await openFilterSubmenu(user, "Created at");

		const apply = await screen.findByRole("button", { name: "Apply" });
		expect(apply).toBeDisabled();

		await tap(user, screen.getByRole("button", { name: dayButtonName(firstOfMonth) }));
		await tap(user, screen.getByRole("button", { name: dayButtonName(thirdOfMonth) }));
		expect(screen.getByText(format(firstOfMonth, "dd/MM/yyyy"))).toBeVisible();
		expect(screen.getByText(format(thirdOfMonth, "dd/MM/yyyy"))).toBeVisible();
		expect(apply).toBeEnabled();

		await tap(user, apply);
		expect(onCreatedAtRangeApply).toHaveBeenLastCalledWith(
			urlDate(firstOfMonth),
			urlDate(thirdOfMonth),
		);

		await tap(user, screen.getByRole("button", { name: "Reset" }));
		expect(onCreatedAtRangeApply).toHaveBeenLastCalledWith("", "");
	});

	it("shows active filters as pills that clear the matching filter", async () => {
		const user = userEvent.setup();
		const { onStatusFiltersChange, onSeverityFiltersChange, onCreatedAtRangeApply } =
			renderAllergiesTable({
				statusFilters: ["inactive"],
				severityFilters: ["mild", "severe"],
				createdFrom: "2020-01-01",
				createdTo: "2020-01-31",
			});

		expect(screen.getByText("Status: Inactive")).toBeVisible();
		expect(screen.getByText("Severity: Mild")).toBeVisible();
		expect(screen.getByText("Severity: Severe")).toBeVisible();
		expect(screen.getByText("Created: Jan 1, 2020 - Jan 31, 2020")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Remove Status: Inactive filter" }));
		expect(onStatusFiltersChange).toHaveBeenCalledWith([]);
		await user.click(screen.getByRole("button", { name: "Remove Severity: Mild filter" }));
		expect(onSeverityFiltersChange).toHaveBeenCalledWith(["severe"]);
		await user.click(screen.getByRole("button", { name: /Remove Created:/ }));
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith("", "");
	});

	it("hides the filter pills when no filter is active", () => {
		renderAllergiesTable();

		expect(screen.queryByRole("button", { name: /Remove .* filter/ })).not.toBeInTheDocument();
	});

	it("paginates through the callbacks", async () => {
		const user = userEvent.setup();
		const { onNextPage, onPreviousPage } = renderAllergiesTable({ page: 2, totalPages: 3 });

		expect(screen.getByText("Page 2 of 3")).toBeVisible();
		expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Next" }));
		expect(onNextPage).toHaveBeenCalledTimes(1);
		await user.click(screen.getByRole("button", { name: "Previous" }));
		expect(onPreviousPage).toHaveBeenCalledTimes(1);
	});

	it("disables paging at the bounds and while a request is pending", () => {
		const { rerender } = render(<AllergiesTable {...buildProps({ page: 1, totalPages: 3 })} />);
		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

		rerender(<AllergiesTable {...buildProps({ page: 3, totalPages: 3 })} />);
		expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

		rerender(<AllergiesTable {...buildProps({ page: 2, totalPages: 3, isPending: true })} />);
		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	it("lets the user change the rows per page", async () => {
		const user = userEvent.setup();
		const { onLimitChange } = renderAllergiesTable({ limit: 14 });

		const rowsPerPage = screen.getByRole("combobox");
		expect(rowsPerPage).toHaveTextContent("14");
		await user.click(rowsPerPage);
		await user.click(await screen.findByRole("option", { name: "42" }));
		expect(onLimitChange).toHaveBeenCalledWith(42);
	});

	it("shows an empty message when there are no allergies", () => {
		renderAllergiesTable({ allergies: [] });

		expect(screen.getByRole("table")).toBeVisible();
		expect(screen.getByText("No matching allergies found.")).toBeVisible();
	});

	it("opens the details drawer with the chosen row's data from the row actions", async () => {
		const user = userEvent.setup();
		renderAllergiesTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Latex" }));
		expect(screen.getByRole("menuitem", { name: "Export" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Archive" })).toBeVisible();
		await user.click(screen.getByRole("menuitem", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "View allergies details" });
		expect(await within(dialog).findByRole("heading", { name: "Latex" })).toBeVisible();
		expect(within(dialog).getByText("Contact rash on hands")).toBeVisible();
		expect(within(dialog).getByText("Nurse Chika")).toBeVisible();
		expect(within(dialog).getByText("Avoid latex gloves.")).toBeVisible();
		expect(within(dialog).queryByText("Peanuts")).not.toBeInTheDocument();
	});

	it("opens the details drawer when a row is activated with the keyboard", async () => {
		const user = userEvent.setup();
		renderAllergiesTable();

		rowFor("Peanuts").focus();
		await user.keyboard("{Enter}");

		const dialog = await screen.findByRole("dialog", { name: "View allergies details" });
		expect(await within(dialog).findByRole("heading", { name: "Peanuts" })).toBeVisible();
		expect(within(dialog).getByText("Carries an epinephrine auto-injector.")).toBeVisible();
	});

	it("opens the add allergy drawer from the toolbar", async () => {
		const user = userEvent.setup();
		renderAllergiesTable();

		await user.click(screen.getByRole("button", { name: "Add allergy" }));
		expect(await screen.findByRole("dialog", { name: "Add allergy" })).toBeVisible();
	});

	it("offers bulk actions for the selected rows, including archive for an admin", async () => {
		auth.role = "admin";
		const user = userEvent.setup();
		renderAllergiesTable();

		const [selectAll] = within(screen.getByRole("table")).getAllByRole("checkbox");
		await user.click(selectAll);

		expect(screen.getByText("2 items selected")).toBeVisible();
		expect(screen.getByRole("button", { name: "Export all" })).toBeVisible();
		expect(screen.getByRole("button", { name: "Archive all" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Clear selected allergies" }));
		expect(screen.queryByText("2 items selected")).not.toBeInTheDocument();
	});

	it("hides archive actions from a member", async () => {
		auth.role = "member";
		const user = userEvent.setup();
		renderAllergiesTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Latex" }));
		expect(screen.getByRole("menuitem", { name: "View details" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Export" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Archive" })).not.toBeInTheDocument();
		await user.keyboard("{Escape}");

		const [, firstRowCheckbox] = within(screen.getByRole("table")).getAllByRole("checkbox");
		await user.click(firstRowCheckbox);
		const bulkBar = screen.getByText("1 item selected").parentElement as HTMLElement;
		expect(within(bulkBar).getByRole("button", { name: "View details" })).toBeVisible();
		expect(within(bulkBar).getByRole("button", { name: "Export" })).toBeVisible();
		expect(within(bulkBar).queryByRole("button", { name: /Archive/ })).not.toBeInTheDocument();
	});
});
