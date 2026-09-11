import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format, setDate, startOfMonth } from "date-fns";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProcedureDetailsType, ProcedureType } from "@/features/patients/types";
import { ProceduresTable } from "./procedures-table";

const authState = vi.hoisted(() => ({ role: "owner" }));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: authState.role } }),
	},
}));

const procedures: ProcedureType[] = [
	{
		procedure: "Knee arthroscopy",
		procedureId: "PROC-3001",
		createdAtLabel: "Mar 5, 2024",
		createdAtSortValue: "2024-03-05",
		indication: "Persistent right knee pain",
		facility: "Orthopaedic Day Surgery",
		status: "Pending",
	},
	{
		procedure: "Appendectomy",
		procedureId: "PROC-1001",
		createdAtLabel: "Jan 12, 2024",
		createdAtSortValue: "2024-01-12",
		indication: "Acute appendicitis",
		facility: "Main Theatre Block",
		status: "Completed",
	},
];

const procedureDetailsById: Record<string, ProcedureDetailsType> = {
	"PROC-1001": {
		procedureId: "PROC-1001",
		encounterId: "ENC-1001",
		name: "Appendectomy",
		indication: "Acute appendicitis",
		status: "Completed",
		procedureDate: "Jan 12, 2024",
		performedBy: "Dr. Zainab Bello",
		assistants: ["Nurse Ade"],
		facility: "Main Theatre Block",
		plannedDate: "Jan 12, 2024",
		plannedPhysician: "Dr. Zainab Bello",
		plannedAssistants: [],
		plannedFacility: "Main Theatre Block",
		clinicalNote: "Uncomplicated laparoscopic removal.",
		createdAt: "Jan 12, 2024",
		updatedAt: "Jan 13, 2024",
		createdBy: "Dr. Bello",
		updatedBy: "Dr. Bello",
		relatedRecords: { diagnosis: null, medication: null },
		history: [],
	},
	"PROC-3001": {
		procedureId: "PROC-3001",
		encounterId: null,
		name: "Knee arthroscopy",
		indication: "Persistent right knee pain",
		status: "Pending",
		procedureDate: "",
		performedBy: "",
		assistants: [],
		facility: "",
		plannedDate: "Apr 2, 2024",
		plannedPhysician: "Dr. Amaka Okafor",
		plannedAssistants: [],
		plannedFacility: "Orthopaedic Day Surgery",
		clinicalNote: "",
		createdAt: "Mar 5, 2024",
		updatedAt: "Mar 5, 2024",
		createdBy: "Dr. Okafor",
		updatedBy: "Dr. Okafor",
		relatedRecords: { diagnosis: null, medication: null },
		history: [],
	},
};

function renderProceduresTable(
	overrides: Partial<React.ComponentProps<typeof ProceduresTable>> = {},
) {
	const props: React.ComponentProps<typeof ProceduresTable> = {
		procedures,
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
			<ProceduresTable {...props} />
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

describe("Procedures table", () => {
	beforeEach(() => {
		authState.role = "owner";
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: string) => {
				const procedureId = decodeURIComponent(input.split("/").pop() ?? "");
				return {
					ok: true,
					json: async () => ({ procedure: procedureDetailsById[procedureId] ?? null }),
				};
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("shows each procedure's name, ID, creation date, indication, facility and status", () => {
		renderProceduresTable();

		for (const label of [
			"Procedure",
			"Procedure ID",
			"Created At",
			"Indication",
			"Facility",
			"Status",
		]) {
			expect(screen.getByRole("columnheader", { name: label })).toBeVisible();
		}

		const [firstRow, secondRow] = bodyRows();
		expect(within(firstRow).getByText("Knee arthroscopy")).toBeVisible();
		expect(within(firstRow).getByRole("button", { name: "Copy PROC-3001" })).toBeVisible();
		expect(within(firstRow).getByText("Mar 5, 2024")).toBeVisible();
		expect(within(firstRow).getByText("Persistent right knee pain")).toBeVisible();
		expect(within(firstRow).getByText("Orthopaedic Day Surgery")).toBeVisible();
		expect(within(firstRow).getByText("Pending")).toBeVisible();

		expect(within(secondRow).getByText("Appendectomy")).toBeVisible();
		expect(within(secondRow).getByText("Jan 12, 2024")).toBeVisible();
		expect(within(secondRow).getByText("Completed")).toBeVisible();
	});

	it("shows an empty message when there are no procedures", () => {
		renderProceduresTable({ procedures: [] });

		expect(screen.getByText("No matching procedures found.")).toBeVisible();
		expect(bodyRows()).toHaveLength(1);
	});

	it("reports what the user types in the search box", async () => {
		const user = userEvent.setup();
		const { onQueryChange } = renderProceduresTable({ query: "Appen" });

		const search = screen.getByRole("searchbox");
		expect(search).toHaveAttribute(
			"placeholder",
			"Search by procedure, indication, facility, procedure ID, or encounter ID",
		);
		expect(search).toHaveValue("Appen");
		await user.type(search, "d");
		expect(onQueryChange).toHaveBeenCalledWith("Append");
	});

	it("drops encounter ID from the search hint when scoped to an encounter", () => {
		renderProceduresTable({ isEncounterScoped: true });

		expect(screen.getByRole("searchbox")).toHaveAttribute(
			"placeholder",
			"Search by procedure, indication, facility, or procedure ID",
		);
	});

	it("re-orders rows when the user sorts by procedure name", async () => {
		const user = userEvent.setup();
		renderProceduresTable();

		expect(displayedIds()).toEqual(["PROC-3001", "PROC-1001"]);

		const procedureHeader = screen.getByRole("columnheader", { name: "Procedure" });
		await user.click(procedureHeader);
		expect(procedureHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedIds()).toEqual(["PROC-1001", "PROC-3001"]);

		await user.click(procedureHeader);
		expect(procedureHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedIds()).toEqual(["PROC-3001", "PROC-1001"]);
	});

	it("sorts by creation date from the keyboard", async () => {
		const user = userEvent.setup();
		renderProceduresTable();

		const createdHeader = screen.getByRole("columnheader", { name: "Created At" });
		createdHeader.focus();
		await user.keyboard("{Enter}");
		expect(createdHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedIds()).toEqual(["PROC-1001", "PROC-3001"]);
		await user.keyboard(" ");
		expect(createdHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedIds()).toEqual(["PROC-3001", "PROC-1001"]);
	});

	it("does not allow sorting by procedure ID or status", () => {
		renderProceduresTable();

		expect(screen.getByRole("columnheader", { name: "Procedure ID" })).not.toHaveAttribute(
			"aria-sort",
		);
		expect(screen.getByRole("columnheader", { name: "Status" })).not.toHaveAttribute("aria-sort");
	});

	it("lists status and created-at filters", async () => {
		const user = userEvent.setup();
		renderProceduresTable();

		await user.click(screen.getByRole("button", { name: "Filter" }));

		expect(screen.getByRole("menuitem", { name: "Status" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Created at" })).toBeVisible();
	});

	it("adds and removes status filters from the Status submenu", async () => {
		const user = userEvent.setup();
		const { onStatusFiltersChange } = renderProceduresTable({ statusFilters: ["pending"] });

		await openFilterSubmenu(user, "Status");

		const pending = await screen.findByRole("checkbox", { name: "Pending" });
		expect(pending).toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Completed" })).not.toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Cancelled" })).not.toBeChecked();

		clickInSubmenu(screen.getByRole("checkbox", { name: "Cancelled" }));
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith(["pending", "cancelled"]);

		clickInSubmenu(pending);
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith([]);
	});

	it("applies a created-at preset as a from/to range", async () => {
		const user = userEvent.setup();
		const { onCreatedAtRangeApply } = renderProceduresTable();

		await openFilterSubmenu(user, "Created at");
		clickInSubmenu(await screen.findByRole("menuitem", { name: "Today" }));

		const today = format(new Date(), "yyyy-MM-dd");
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith(today, today);
	});

	it("applies a custom created-at range picked on the calendar and can reset it", async () => {
		const user = userEvent.setup();
		const { onCreatedAtRangeApply } = renderProceduresTable();

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
		const { onStatusFiltersChange, onCreatedAtRangeApply } = renderProceduresTable({
			statusFilters: ["pending", "completed"],
			createdFrom: "",
			createdTo: "2024-02-29",
		});

		expect(screen.getByText("Status: Pending")).toBeVisible();
		expect(screen.getByText("Status: Completed")).toBeVisible();
		expect(screen.getByText("Created: Until Feb 29, 2024")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Remove Status: Pending filter" }));
		expect(onStatusFiltersChange).toHaveBeenCalledWith(["completed"]);

		await user.click(screen.getByRole("button", { name: /Remove Created:/ }));
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith("", "");
	});

	it("shows no filter pills when no filters are active", () => {
		renderProceduresTable();

		expect(screen.queryByRole("button", { name: /^Remove / })).not.toBeInTheDocument();
	});

	it("paginates through the owner callbacks and shows the current page", async () => {
		const user = userEvent.setup();
		const { onNextPage, onPreviousPage } = renderProceduresTable({ page: 2, totalPages: 4 });

		expect(screen.getByText("Page 2 of 4")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Next" }));
		expect(onNextPage).toHaveBeenCalledTimes(1);
		await user.click(screen.getByRole("button", { name: "Previous" }));
		expect(onPreviousPage).toHaveBeenCalledTimes(1);
	});

	it("disables Previous on the first page and Next on the last page", () => {
		renderProceduresTable({ page: 1, totalPages: 1 });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	it("disables paging and the rows-per-page picker while a request is pending", () => {
		renderProceduresTable({ page: 2, totalPages: 3, isPending: true });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
		expect(rowsPerPagePicker()).toBeDisabled();
	});

	it("lets the user change the rows per page", async () => {
		const user = userEvent.setup();
		const { onLimitChange } = renderProceduresTable({ limit: 28 });

		const picker = rowsPerPagePicker();
		expect(picker).toHaveTextContent("28");
		await user.click(picker);
		await user.click(await screen.findByRole("option", { name: "42" }));
		expect(onLimitChange).toHaveBeenCalledWith(42);
	});

	it("opens the details drawer with that procedure's data from the row actions", async () => {
		const user = userEvent.setup();
		renderProceduresTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Appendectomy" }));
		expect(await screen.findByRole("menuitem", { name: "Export" })).toBeVisible();
		await user.click(screen.getByRole("menuitem", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "View procedure details" });
		expect(await within(dialog).findByRole("heading", { name: "Appendectomy" })).toBeVisible();
		expect(within(dialog).getByText("Acute appendicitis")).toBeVisible();
		expect(within(dialog).getByText("Dr. Zainab Bello")).toBeVisible();
		expect(within(dialog).getByText("Uncomplicated laparoscopic removal.")).toBeVisible();
		expect(within(dialog).getByRole("button", { name: "Copy ENC-1001" })).toBeVisible();
	});

	it("opens the details drawer when a row is activated from the keyboard", async () => {
		const user = userEvent.setup();
		renderProceduresTable();

		const [firstRow] = bodyRows();
		firstRow.focus();
		await user.keyboard("{Enter}");

		const dialog = await screen.findByRole("dialog", { name: "View procedure details" });
		expect(await within(dialog).findByRole("heading", { name: "Knee arthroscopy" })).toBeVisible();
		expect(within(dialog).getByText("Planned date")).toBeVisible();
		expect(within(dialog).getByText("Apr 2, 2024")).toBeVisible();
	});

	it("only offers status changes on pending procedures", async () => {
		const user = userEvent.setup();
		renderProceduresTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Knee arthroscopy" }));
		expect(await screen.findByRole("menuitem", { name: "Mark as completed" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Cancel" })).toBeVisible();
		await user.keyboard("{Escape}");

		await user.click(screen.getByRole("button", { name: "Open actions for Appendectomy" }));
		expect(await screen.findByRole("menuitem", { name: "View details" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Mark as completed" })).not.toBeInTheDocument();
		expect(screen.queryByRole("menuitem", { name: "Cancel" })).not.toBeInTheDocument();
	});

	it("offers Archive to an owner in the row actions and the bulk bar", async () => {
		const user = userEvent.setup();
		renderProceduresTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Appendectomy" }));
		expect(await screen.findByRole("menuitem", { name: "Archive" })).toBeVisible();
		await user.keyboard("{Escape}");

		const [firstRow, secondRow] = bodyRows();
		await user.click(within(firstRow).getByRole("checkbox"));
		expect(screen.getByText("1 item selected")).toBeVisible();
		expect(screen.getByRole("button", { name: "Archive" })).toBeVisible();

		await user.click(within(secondRow).getByRole("checkbox"));
		expect(screen.getByText("2 items selected")).toBeVisible();
		expect(screen.getByRole("button", { name: "Archive all" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Clear selected procedures" }));
		expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
	});

	it("hides Archive from a member in the row actions and the bulk bar", async () => {
		authState.role = "member";
		const user = userEvent.setup();
		renderProceduresTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Appendectomy" }));
		expect(await screen.findByRole("menuitem", { name: "View details" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Archive" })).not.toBeInTheDocument();
		await user.keyboard("{Escape}");

		const [firstRow] = bodyRows();
		await user.click(within(firstRow).getByRole("checkbox"));
		expect(screen.getByText("1 item selected")).toBeVisible();
		expect(screen.queryByRole("button", { name: /Archive/ })).not.toBeInTheDocument();
	});

	it("opens the selected procedure's details from the bulk bar", async () => {
		const user = userEvent.setup();
		renderProceduresTable();

		const [, secondRow] = bodyRows();
		await user.click(within(secondRow).getByRole("checkbox"));
		await user.click(screen.getByRole("button", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "View procedure details" });
		expect(await within(dialog).findByRole("heading", { name: "Appendectomy" })).toBeVisible();
	});

	it("opens the add procedure drawer from the Add procedure button", async () => {
		const user = userEvent.setup();
		renderProceduresTable();

		await user.click(screen.getByRole("button", { name: "Add procedure" }));

		expect(await screen.findByRole("dialog", { name: "Add procedure" })).toBeVisible();
	});
});
