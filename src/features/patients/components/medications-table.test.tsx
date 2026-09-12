import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDays, format, startOfMonth, subDays } from "date-fns";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { MedicationDetailsType, MedicationType } from "@/features/patients/types";
import { MedicationsTable } from "./medications-table";

const auth = vi.hoisted(() => ({ role: "owner" }));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: auth.role } }),
	},
}));

const medications: MedicationType[] = [
	{
		medication: "Metformin",
		dose: "500 mg",
		route: "Oral",
		medicationId: "MED-metformin",
		indication: "Type 2 diabetes",
		createdAtLabel: "Apr 2, 2021",
		createdAtSortValue: "2021-04-02",
		status: "Active",
	},
	{
		medication: "Amoxicillin",
		dose: "250 mg",
		route: "Intravenous",
		medicationId: "MED-amox",
		indication: "Ear infection",
		createdAtLabel: "Feb 14, 2020",
		createdAtSortValue: "2020-02-14",
		status: "Completed",
	},
];

const medicationDetails: Record<string, MedicationDetailsType> = {
	"MED-metformin": {
		medicationId: "MED-metformin",
		encounterId: "ENC-1",
		name: "Metformin",
		dose: "500 mg",
		route: "Oral",
		indication: "Type 2 diabetes",
		status: "Active",
		frequency: "Twice daily",
		duration: "Ongoing",
		prescribedBy: "Dr. Okafor",
		startedAt: "Apr 2, 2021",
		createdAt: "Apr 3, 2021",
		updatedAt: "Apr 9, 2021",
		createdBy: "Nurse Chika",
		clinicalNote: "Review renal function every six months.",
		history: [
			{
				id: "created",
				title: "Prescribed",
				actor: "Nurse Chika",
				timestamp: "3 April 2021 at 09:00",
				items: [{ label: "Dose", value: "500 mg" }],
			},
		],
	},
	"MED-amox": {
		medicationId: "MED-amox",
		encounterId: null,
		name: "Amoxicillin",
		dose: "250 mg",
		route: "Intravenous",
		indication: "Ear infection",
		status: "Completed",
		frequency: "Three times daily",
		duration: "7 days",
		prescribedBy: "Dr. Adeyemi",
		startedAt: "Feb 14, 2020",
		createdAt: "Feb 15, 2020",
		updatedAt: "Feb 21, 2020",
		createdBy: "Dr. Bello",
		clinicalNote: "Course completed without side effects.",
		history: [
			{
				id: "created",
				title: "Prescribed",
				actor: "Dr. Bello",
				timestamp: "15 February 2020 at 09:00",
				items: [{ label: "Dose", value: "250 mg" }],
			},
		],
	},
};

type MedicationsTableProps = React.ComponentProps<typeof MedicationsTable>;

function buildProps(overrides: Partial<MedicationsTableProps> = {}): MedicationsTableProps {
	return {
		medications,
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
}

function renderMedicationsTable(overrides: Partial<MedicationsTableProps> = {}) {
	const props = buildProps(overrides);

	render(<MedicationsTable {...props} />);

	return props;
}

function displayedMedications() {
	return Array.from(screen.getByRole("table").querySelectorAll("tbody tr")).map(
		(row) => within(row as HTMLElement).getAllByRole("cell")[1].textContent,
	);
}

function rowFor(medication: string) {
	return screen.getByText(medication).closest("tr") as HTMLElement;
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

describe("Medications table", () => {
	beforeEach(() => {
		auth.role = "owner";
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: RequestInfo | URL) => {
				const id = decodeURIComponent(String(input).split("/").pop() ?? "");
				return {
					ok: true,
					json: async () => ({ medication: medicationDetails[id] ?? null }),
				} as Response;
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("lists medications in the supplied order with dose, route, indication, date and status", () => {
		renderMedicationsTable();

		expect(screen.getByRole("heading", { name: "Medications" })).toBeVisible();
		for (const header of [
			"Medication",
			"Dose",
			"Route",
			"Medication ID",
			"Indication",
			"Created at",
			"Status",
		]) {
			expect(screen.getByRole("columnheader", { name: header })).toBeVisible();
		}

		expect(displayedMedications()).toEqual(["Metformin", "Amoxicillin"]);

		const metforminRow = rowFor("Metformin");
		expect(within(metforminRow).getByRole("cell", { name: "500 mg" })).toBeVisible();
		expect(within(metforminRow).getByRole("cell", { name: "Oral" })).toBeVisible();
		expect(within(metforminRow).getByRole("cell", { name: "Type 2 diabetes" })).toBeVisible();
		expect(within(metforminRow).getByRole("cell", { name: "Apr 2, 2021" })).toBeVisible();
		expect(within(metforminRow).getByRole("button", { name: "Copy MED-metformin" })).toBeVisible();
		expect(within(metforminRow).getByText("Active")).toBeVisible();

		const amoxicillinRow = rowFor("Amoxicillin");
		expect(within(amoxicillinRow).getByRole("cell", { name: "250 mg" })).toBeVisible();
		expect(within(amoxicillinRow).getByRole("cell", { name: "Intravenous" })).toBeVisible();
		expect(within(amoxicillinRow).getByText("Completed")).toBeVisible();
	});

	test("re-orders rows when a sortable header is clicked", async () => {
		const user = userEvent.setup();
		renderMedicationsTable();

		const medicationHeader = screen.getByRole("columnheader", { name: "Medication" });
		expect(medicationHeader).toHaveAttribute("aria-sort", "none");
		await user.click(medicationHeader);
		expect(medicationHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedMedications()).toEqual(["Amoxicillin", "Metformin"]);
		await user.click(medicationHeader);
		expect(medicationHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedMedications()).toEqual(["Metformin", "Amoxicillin"]);

		const routeHeader = screen.getByRole("columnheader", { name: "Route" });
		await user.click(routeHeader);
		expect(routeHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedMedications()).toEqual(["Amoxicillin", "Metformin"]);

		const createdHeader = screen.getByRole("columnheader", { name: "Created at" });
		await user.click(createdHeader);
		await user.click(createdHeader);
		expect(createdHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedMedications()).toEqual(["Metformin", "Amoxicillin"]);

		expect(screen.getByRole("columnheader", { name: "Dose" })).not.toHaveAttribute("aria-sort");
		expect(screen.getByRole("columnheader", { name: "Status" })).not.toHaveAttribute("aria-sort");
	});

	test("reports what the user types in the search box", async () => {
		const user = userEvent.setup();
		const { onQueryChange } = renderMedicationsTable({ query: "Met" });

		const search = screen.getByRole("searchbox");
		expect(search).toHaveAttribute(
			"placeholder",
			"Search by medication, dose, route, indication, medication ID, or encounter ID",
		);
		expect(search).toHaveValue("Met");
		await user.type(search, "f");
		expect(onQueryChange).toHaveBeenCalledWith("Metf");
	});

	test("drops the encounter ID hint from the search box when scoped to an encounter", () => {
		renderMedicationsTable({ isEncounterScoped: true });

		expect(screen.getByRole("searchbox")).toHaveAttribute(
			"placeholder",
			"Search by medication, dose, route, indication, or medication ID",
		);
	});

	test("adds and removes status filters from the filter menu", async () => {
		const user = userEvent.setup();
		const { onStatusFiltersChange } = renderMedicationsTable({ statusFilters: ["active"] });

		await openFilterSubmenu(user, "Status");

		const activeOption = await screen.findByRole("checkbox", { name: "Active" });
		expect(activeOption).toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Completed" })).not.toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Discontinued" })).not.toBeChecked();

		await tap(user, screen.getByRole("checkbox", { name: "Discontinued" }));
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith(["active", "discontinued"]);

		await tap(user, activeOption);
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith([]);
	});

	test("applies created-at date presets", async () => {
		const user = userEvent.setup();
		const today = new Date();
		const { onCreatedAtRangeApply } = renderMedicationsTable();

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

	test("applies a custom calendar range and can reset it", async () => {
		const user = userEvent.setup();
		const firstOfMonth = startOfMonth(new Date());
		const thirdOfMonth = addDays(firstOfMonth, 2);
		const { onCreatedAtRangeApply } = renderMedicationsTable();

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

	test("shows active filters as pills that clear the matching filter", async () => {
		const user = userEvent.setup();
		const { onStatusFiltersChange, onCreatedAtRangeApply } = renderMedicationsTable({
			statusFilters: ["completed", "discontinued"],
			createdFrom: "2020-01-01",
			createdTo: "",
		});

		expect(screen.getByText("Status: Completed")).toBeVisible();
		expect(screen.getByText("Status: Discontinued")).toBeVisible();
		expect(screen.getByText("Created: From Jan 1, 2020")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Remove Status: Completed filter" }));
		expect(onStatusFiltersChange).toHaveBeenCalledWith(["discontinued"]);
		await user.click(screen.getByRole("button", { name: /Remove Created:/ }));
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith("", "");
	});

	test("hides the filter pills when no filter is active", () => {
		renderMedicationsTable();

		expect(screen.queryByRole("button", { name: /Remove .* filter/ })).not.toBeInTheDocument();
	});

	test("paginates through the callbacks", async () => {
		const user = userEvent.setup();
		const { onNextPage, onPreviousPage } = renderMedicationsTable({ page: 2, totalPages: 3 });

		expect(screen.getByText("Page 2 of 3")).toBeVisible();
		expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Next" }));
		expect(onNextPage).toHaveBeenCalledTimes(1);
		await user.click(screen.getByRole("button", { name: "Previous" }));
		expect(onPreviousPage).toHaveBeenCalledTimes(1);
	});

	test("disables paging at the bounds and while a request is pending", () => {
		const { rerender } = render(<MedicationsTable {...buildProps({ page: 1, totalPages: 3 })} />);
		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

		rerender(<MedicationsTable {...buildProps({ page: 3, totalPages: 3 })} />);
		expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

		rerender(<MedicationsTable {...buildProps({ page: 2, totalPages: 3, isPending: true })} />);
		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	test("lets the user change the rows per page", async () => {
		const user = userEvent.setup();
		const { onLimitChange } = renderMedicationsTable({ limit: 14 });

		const rowsPerPage = screen.getByRole("combobox");
		expect(rowsPerPage).toHaveTextContent("14");
		await user.click(rowsPerPage);
		await user.click(await screen.findByRole("option", { name: "28" }));
		expect(onLimitChange).toHaveBeenCalledWith(28);
	});

	test("shows an empty message when there are no medications", () => {
		renderMedicationsTable({ medications: [] });

		expect(screen.getByRole("table")).toBeVisible();
		expect(screen.getByText("No matching medications found.")).toBeVisible();
	});

	test("opens the details drawer with the chosen row's data from the row actions", async () => {
		const user = userEvent.setup();
		renderMedicationsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Amoxicillin" }));
		expect(screen.getByRole("menuitem", { name: "Export" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Archive" })).toBeVisible();
		await user.click(screen.getByRole("menuitem", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "View medication details" });
		expect(await within(dialog).findByRole("heading", { name: "Amoxicillin" })).toBeVisible();
		expect(within(dialog).getByText("Three times daily")).toBeVisible();
		expect(within(dialog).getByText("7 days")).toBeVisible();
		expect(within(dialog).getByText("Dr. Adeyemi")).toBeVisible();
		expect(within(dialog).getByRole("heading", { name: "Activity" })).toBeVisible();
		expect(
			within(dialog).getByRole("button", { name: /Prescribed by Dr. Bello/ }),
		).toHaveAttribute("aria-expanded", "false");
		expect(within(dialog).queryByText("Metformin")).not.toBeInTheDocument();
	});

	test("opens the details drawer when a row is activated with the keyboard", async () => {
		const user = userEvent.setup();
		renderMedicationsTable();

		rowFor("Metformin").focus();
		await user.keyboard("{Enter}");

		const dialog = await screen.findByRole("dialog", { name: "View medication details" });
		expect(await within(dialog).findByRole("heading", { name: "Metformin" })).toBeVisible();
		expect(within(dialog).getByText("Twice daily")).toBeVisible();
		expect(within(dialog).getByText("Ongoing")).toBeVisible();
	});

	test("only offers status changes for active medications", async () => {
		const user = userEvent.setup();
		renderMedicationsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Metformin" }));
		expect(screen.getByRole("menuitem", { name: "Mark as completed" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Discontinue" })).toBeVisible();
		await user.keyboard("{Escape}");

		await user.click(screen.getByRole("button", { name: "Open actions for Amoxicillin" }));
		expect(screen.getByRole("menuitem", { name: "View details" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Mark as completed" })).not.toBeInTheDocument();
		expect(screen.queryByRole("menuitem", { name: "Discontinue" })).not.toBeInTheDocument();
	});

	test("opens the add medication drawer from the toolbar", async () => {
		const user = userEvent.setup();
		renderMedicationsTable();

		await user.click(screen.getByRole("button", { name: "Add medication" }));
		expect(await screen.findByRole("dialog", { name: "Add medication" })).toBeVisible();
	});

	test("offers bulk actions for the selected rows, including archive for an admin", async () => {
		auth.role = "admin";
		const user = userEvent.setup();
		renderMedicationsTable();

		const [selectAll] = within(screen.getByRole("table")).getAllByRole("checkbox");
		await user.click(selectAll);

		expect(screen.getByText("2 items selected")).toBeVisible();
		expect(screen.getByRole("button", { name: "Export all" })).toBeVisible();
		expect(screen.getByRole("button", { name: "Archive all" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Clear selected medications" }));
		expect(screen.queryByText("2 items selected")).not.toBeInTheDocument();
	});

	test("hides archive actions from a member", async () => {
		auth.role = "member";
		const user = userEvent.setup();
		renderMedicationsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Amoxicillin" }));
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
