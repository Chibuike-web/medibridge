import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format, subDays } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImagingType } from "@/features/patients/types";
import { ImagingTable } from "./imaging-table";

const activeMember = vi.hoisted(() => ({ role: "owner" }));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: activeMember.role } }),
	},
}));

const imagingStudies: ImagingType[] = [
	{
		study: "Chest X-ray",
		imagingId: "IMG-CXR",
		encounterId: "ENC-1",
		modality: "X-ray",
		region: "Chest",
		impression: "No acute cardiopulmonary findings.",
		orderedAtLabel: "Jan 5, 2020",
		orderedAtValue: "2020-01-05",
		orderedAtSortValue: "2020-01-05T00:00:00.000Z",
		orderedBy: "Dr. Okafor",
		reportedBy: "Dr. Musa",
		status: "Completed",
		clinicalNote: "Follow-up in six weeks.",
		files: [],
		createdBy: "Nurse Ada",
		updatedBy: "Nurse Ada",
		createdAtLabel: "Jan 6, 2020",
		updatedAtLabel: "Jan 7, 2020",
		history: [],
	},
	{
		study: "Abdominal Ultrasound",
		imagingId: "IMG-USA",
		encounterId: "ENC-2",
		modality: "Ultrasound",
		region: "Abdomen",
		impression: "-",
		orderedAtLabel: "Jan 1, 2020",
		orderedAtValue: "2020-01-01",
		orderedAtSortValue: "2020-01-01T00:00:00.000Z",
		orderedBy: "Dr. Bello",
		reportedBy: "",
		status: "Pending",
		clinicalNote: "",
		files: [],
		createdBy: "Nurse Ada",
		updatedBy: "Nurse Ada",
		createdAtLabel: "Jan 2, 2020",
		updatedAtLabel: "Jan 2, 2020",
		history: [],
	},
];

function renderImagingTable(overrides: Partial<React.ComponentProps<typeof ImagingTable>> = {}) {
	const props: React.ComponentProps<typeof ImagingTable> = {
		imagingStudies,
		page: 1,
		limit: 14,
		totalPages: 1,
		query: "",
		orderedFrom: "",
		orderedTo: "",
		createdFrom: "",
		createdTo: "",
		statusFilters: [],
		modalityFilters: [],
		isPending: false,
		onQueryChange: vi.fn(),
		onOrderedAtRangeApply: vi.fn(),
		onCreatedAtRangeApply: vi.fn(),
		onStatusFiltersChange: vi.fn(),
		onModalityFiltersChange: vi.fn(),
		onPreviousPage: vi.fn(),
		onNextPage: vi.fn(),
		onLimitChange: vi.fn(),
		...overrides,
	};

	render(<ImagingTable {...props} />);

	return props;
}

function bodyRows() {
	return Array.from(screen.getByRole("table").querySelectorAll("tbody tr")) as HTMLElement[];
}

function displayedImagingIds() {
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

describe("Imaging table", () => {
	beforeEach(() => {
		activeMember.role = "owner";
	});

	it("shows each study with its modality, region, impression, order date and status", () => {
		renderImagingTable();

		expect(screen.getByRole("heading", { name: "Imaging" })).toBeVisible();
		for (const label of [
			"Study",
			"Imaging ID",
			"Modality",
			"Region",
			"Impression",
			"Ordered At",
			"Status",
		]) {
			expect(screen.getByRole("columnheader", { name: label })).toBeVisible();
		}
		expect(displayedImagingIds()).toEqual(["IMG-CXR", "IMG-USA"]);

		const [cxrRow, usaRow] = bodyRows();
		expect(within(cxrRow).getByText("Chest X-ray")).toBeVisible();
		expect(within(cxrRow).getByText("X-ray")).toBeVisible();
		expect(within(cxrRow).getByText("Chest")).toBeVisible();
		expect(within(cxrRow).getByText("No acute cardiopulmonary findings.")).toBeVisible();
		expect(within(cxrRow).getByText("Jan 5, 2020")).toBeVisible();
		expect(within(cxrRow).getByText("Completed")).toBeVisible();

		expect(within(usaRow).getByText("Ultrasound")).toBeVisible();
		expect(within(usaRow).getByText("Pending")).toBeVisible();
		expect(within(usaRow).getByRole("button", { name: "Copy IMG-USA" })).toBeVisible();
	});

	it("shows the empty state when there are no studies", () => {
		renderImagingTable({ imagingStudies: [] });

		expect(screen.getByText("No matching imaging studies found.")).toBeVisible();
		expect(bodyRows()).toHaveLength(1);
	});

	it("reports what the user types in the search box and shows the controlled query", async () => {
		const user = userEvent.setup();
		const { onQueryChange } = renderImagingTable({ query: "Ches" });

		const search = screen.getByRole("searchbox");
		expect(search).toHaveAttribute(
			"placeholder",
			"Search by study, modality, region, impression, imaging ID, or encounter ID",
		);
		expect(search).toHaveValue("Ches");
		await user.type(search, "t");
		expect(onQueryChange).toHaveBeenCalledWith("Chest");
	});

	it("drops the encounter ID hint from the search box when scoped to an encounter", () => {
		renderImagingTable({ isEncounterScoped: true });

		expect(screen.getByRole("searchbox")).toHaveAttribute(
			"placeholder",
			"Search by study, modality, region, impression, or imaging ID",
		);
	});

	it("sorts rows by study name when the header is clicked, then reverses, then clears", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		const studyHeader = screen.getByRole("columnheader", { name: "Study" });
		expect(studyHeader).toHaveAttribute("aria-sort", "none");

		await user.click(studyHeader);
		expect(studyHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedImagingIds()).toEqual(["IMG-USA", "IMG-CXR"]);

		await user.click(studyHeader);
		expect(studyHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedImagingIds()).toEqual(["IMG-CXR", "IMG-USA"]);

		await user.click(studyHeader);
		expect(studyHeader).toHaveAttribute("aria-sort", "none");
		expect(displayedImagingIds()).toEqual(["IMG-CXR", "IMG-USA"]);
	});

	it("sorts by modality and region", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		await user.click(screen.getByRole("columnheader", { name: "Modality" }));
		expect(displayedImagingIds()).toEqual(["IMG-USA", "IMG-CXR"]);

		await user.click(screen.getByRole("columnheader", { name: "Region" }));
		expect(screen.getByRole("columnheader", { name: "Modality" })).toHaveAttribute(
			"aria-sort",
			"none",
		);
		expect(screen.getByRole("columnheader", { name: "Region" })).toHaveAttribute(
			"aria-sort",
			"ascending",
		);
		expect(displayedImagingIds()).toEqual(["IMG-USA", "IMG-CXR"]);
	});

	it("sorts by order date chronologically using the keyboard", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		const orderedAtHeader = screen.getByRole("columnheader", { name: "Ordered At" });
		orderedAtHeader.focus();
		await user.keyboard("{Enter}");
		expect(orderedAtHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedImagingIds()).toEqual(["IMG-USA", "IMG-CXR"]);

		await user.keyboard(" ");
		expect(orderedAtHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedImagingIds()).toEqual(["IMG-CXR", "IMG-USA"]);
	});

	it("does not offer sorting on the imaging ID, impression or status columns", () => {
		renderImagingTable();

		for (const label of ["Imaging ID", "Impression", "Status"]) {
			expect(screen.getByRole("columnheader", { name: label })).not.toHaveAttribute("aria-sort");
		}
	});

	it("adds and removes status filters from the checkbox list", async () => {
		const user = setupSubmenuUser();
		const { onStatusFiltersChange } = renderImagingTable({ statusFilters: ["completed"] });

		await openFilterSubmenu(user, "Status");

		expect(await screen.findByRole("checkbox", { name: "Completed" })).toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Cancelled" })).not.toBeChecked();

		await user.click(screen.getByRole("checkbox", { name: "Pending" }));
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith(["completed", "pending"]);

		await user.click(screen.getByRole("checkbox", { name: "Completed" }));
		expect(onStatusFiltersChange).toHaveBeenLastCalledWith([]);
	});

	it("offers every modality and reports the chosen modalities", async () => {
		const user = setupSubmenuUser();
		const { onModalityFiltersChange } = renderImagingTable({ modalityFilters: ["mri"] });

		await openFilterSubmenu(user, "Modality");

		for (const label of ["CT", "MRI", "Ultrasound", "X-ray"]) {
			expect(await screen.findByRole("checkbox", { name: label })).toBeVisible();
		}
		expect(screen.getByRole("checkbox", { name: "MRI" })).toBeChecked();

		await user.click(screen.getByRole("checkbox", { name: "X-ray" }));
		expect(onModalityFiltersChange).toHaveBeenCalledWith(["mri", "x-ray"]);
	});

	it("disables the filter checkboxes while a request is pending", async () => {
		const user = setupSubmenuUser();
		renderImagingTable({ isPending: true });

		await openFilterSubmenu(user, "Modality");
		expect(await screen.findByRole("checkbox", { name: "CT" })).toBeDisabled();
	});

	it("applies an order date preset to the ordered-at range only", async () => {
		const user = setupSubmenuUser();
		const { onOrderedAtRangeApply, onCreatedAtRangeApply } = renderImagingTable();

		await openFilterSubmenu(user, "Ordered at");
		await user.click(await screen.findByRole("menuitem", { name: "Last 30 days" }));

		const today = new Date();
		expect(onOrderedAtRangeApply).toHaveBeenCalledWith(
			format(subDays(today, 29), "yyyy-MM-dd"),
			format(today, "yyyy-MM-dd"),
		);
		expect(onCreatedAtRangeApply).not.toHaveBeenCalled();
	});

	it("applies a creation date preset to the created-at range only", async () => {
		const user = setupSubmenuUser();
		const { onOrderedAtRangeApply, onCreatedAtRangeApply } = renderImagingTable();

		await openFilterSubmenu(user, "Created at");
		await user.click(await screen.findByRole("menuitem", { name: "Today" }));

		const today = format(new Date(), "yyyy-MM-dd");
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith(today, today);
		expect(onOrderedAtRangeApply).not.toHaveBeenCalled();
	});

	it("applies a custom order date range picked from the calendar", async () => {
		const user = setupSubmenuUser();
		const { onOrderedAtRangeApply } = renderImagingTable();

		await openFilterSubmenu(user, "Ordered at");
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
		expect(onOrderedAtRangeApply).toHaveBeenCalledWith(
			format(start, "yyyy-MM-dd"),
			format(end, "yyyy-MM-dd"),
		);
	});

	it("clears the order date range from the calendar reset button", async () => {
		const user = setupSubmenuUser();
		const { onOrderedAtRangeApply } = renderImagingTable({
			orderedFrom: "2020-01-01",
			orderedTo: "2020-01-31",
		});

		await openFilterSubmenu(user, "Ordered at");
		expect(await screen.findByText("01/01/2020")).toBeVisible();
		expect(screen.getByText("31/01/2020")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Reset" }));
		expect(onOrderedAtRangeApply).toHaveBeenCalledWith("", "");
	});

	it("shows active filters as pills that can be removed individually", async () => {
		const user = userEvent.setup();
		const {
			onOrderedAtRangeApply,
			onCreatedAtRangeApply,
			onStatusFiltersChange,
			onModalityFiltersChange,
		} = renderImagingTable({
			orderedFrom: "2020-01-01",
			orderedTo: "2020-01-31",
			createdFrom: "2020-02-01",
			statusFilters: ["pending", "cancelled"],
			modalityFilters: ["ultrasound"],
		});

		expect(screen.getByText("Status: Pending")).toBeVisible();
		expect(screen.getByText("Status: Cancelled")).toBeVisible();
		expect(screen.getByText("Modality: Ultrasound")).toBeVisible();
		expect(screen.getByText("Ordered: Jan 1, 2020 - Jan 31, 2020")).toBeVisible();
		expect(screen.getByText("Created: From Feb 1, 2020")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Remove Status: Cancelled filter" }));
		expect(onStatusFiltersChange).toHaveBeenCalledWith(["pending"]);

		await user.click(screen.getByRole("button", { name: "Remove Modality: Ultrasound filter" }));
		expect(onModalityFiltersChange).toHaveBeenCalledWith([]);

		await user.click(
			screen.getByRole("button", { name: "Remove Ordered: Jan 1, 2020 - Jan 31, 2020 filter" }),
		);
		expect(onOrderedAtRangeApply).toHaveBeenCalledWith("", "");
		expect(onCreatedAtRangeApply).not.toHaveBeenCalled();

		await user.click(
			screen.getByRole("button", { name: "Remove Created: From Feb 1, 2020 filter" }),
		);
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith("", "");
	});

	it.todo(
		"labels modality pills the same way as the filter options (pill shows 'Modality: Ct', 'Modality: Mri' and 'Modality: X Ray' for options labelled CT, MRI and X-ray)",
	);

	it("shows no filter pills when no filter is active", () => {
		renderImagingTable();

		expect(screen.queryByRole("button", { name: /^Remove .* filter$/ })).not.toBeInTheDocument();
	});

	it("moves between pages through the callbacks", async () => {
		const user = userEvent.setup();
		const { onNextPage, onPreviousPage } = renderImagingTable({ page: 2, totalPages: 3 });

		expect(screen.getByText("Page 2 of 3")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Next" }));
		expect(onNextPage).toHaveBeenCalledTimes(1);
		await user.click(screen.getByRole("button", { name: "Previous" }));
		expect(onPreviousPage).toHaveBeenCalledTimes(1);
	});

	it("disables going back from the first page", () => {
		renderImagingTable({ page: 1, totalPages: 3 });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
	});

	it("disables going forward from the last page", () => {
		renderImagingTable({ page: 3, totalPages: 3 });

		expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	it("disables paging while a request is pending", () => {
		renderImagingTable({ page: 2, totalPages: 3, isPending: true });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	it("lets the user change the rows per page", async () => {
		const user = userEvent.setup();
		const { onLimitChange } = renderImagingTable({ limit: 28 });

		const rowsPerPage = screen.getByRole("combobox");
		expect(rowsPerPage).toHaveTextContent("28");
		await user.click(rowsPerPage);
		await user.click(await screen.findByRole("option", { name: "42" }));
		expect(onLimitChange).toHaveBeenCalledWith(42);
	});

	it("opens the details drawer for the row chosen from its action menu", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Chest X-ray" }));
		await user.click(await screen.findByRole("menuitem", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "View imaging details" });
		expect(within(dialog).getByRole("heading", { name: "Chest X-ray" })).toBeVisible();
		expect(within(dialog).getByText("No acute cardiopulmonary findings.")).toBeVisible();
		expect(within(dialog).getByText("Chest")).toBeVisible();
		expect(within(dialog).getByText("Dr. Okafor")).toBeVisible();
		expect(within(dialog).getByText("Follow-up in six weeks.")).toBeVisible();
		expect(within(dialog).queryByText("Abdominal Ultrasound")).not.toBeInTheDocument();
	});

	it("opens the details drawer when the row itself is activated with the keyboard", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		const [, usaRow] = bodyRows();
		usaRow.focus();
		await user.keyboard("{Enter}");

		const dialog = await screen.findByRole("dialog", { name: "View imaging details" });
		expect(within(dialog).getByRole("heading", { name: "Abdominal Ultrasound" })).toBeVisible();
	});

	it("only offers status changes for pending studies", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Abdominal Ultrasound" }));
		expect(await screen.findByRole("menuitem", { name: "Mark as completed" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Cancel" })).toBeVisible();
		await user.keyboard("{Escape}");

		await user.click(screen.getByRole("button", { name: "Open actions for Chest X-ray" }));
		expect(await screen.findByRole("menuitem", { name: "Export" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Mark as completed" })).not.toBeInTheDocument();
		expect(screen.queryByRole("menuitem", { name: "Cancel" })).not.toBeInTheDocument();
	});

	it("opens the create drawer from the add button", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		await user.click(screen.getByRole("button", { name: "Add imaging" }));
		expect(await screen.findByRole("dialog", { name: "Add imaging" })).toBeVisible();
	});

	it("shows archive actions to an owner", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Chest X-ray" }));
		expect(await screen.findByRole("menuitem", { name: "Archive" })).toBeVisible();
		await user.keyboard("{Escape}");

		await user.click(screen.getAllByRole("checkbox")[1]);
		const bar = bulkActionBar();
		expect(within(bar).getByText("1 item selected")).toBeVisible();
		expect(within(bar).getByRole("button", { name: "Archive" })).toBeVisible();
	});

	it("shows archive actions to an admin", async () => {
		activeMember.role = "admin";
		const user = userEvent.setup();
		renderImagingTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Chest X-ray" }));
		expect(await screen.findByRole("menuitem", { name: "Archive" })).toBeVisible();
	});

	it("hides archive actions from a member", async () => {
		activeMember.role = "member";
		const user = userEvent.setup();
		renderImagingTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Chest X-ray" }));
		expect(await screen.findByRole("menuitem", { name: "View details" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Archive" })).not.toBeInTheDocument();
		await user.keyboard("{Escape}");

		await user.click(screen.getAllByRole("checkbox")[1]);
		const bar = bulkActionBar();
		expect(within(bar).getByText("1 item selected")).toBeVisible();
		expect(within(bar).getByRole("button", { name: "Export" })).toBeVisible();
		expect(within(bar).queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
	});

	it("selects rows for bulk actions and clears the selection", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		const [selectAll, firstRow] = screen.getAllByRole("checkbox");
		await user.click(firstRow);
		expect(screen.getByText("1 item selected")).toBeVisible();
		expect(screen.getByRole("button", { name: "View details" })).toBeVisible();

		await user.click(selectAll);
		expect(screen.getByText("2 items selected")).toBeVisible();
		expect(screen.queryByRole("button", { name: "View details" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Archive all" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Clear selected imaging records" }));
		expect(screen.queryByText(/items? selected/)).not.toBeInTheDocument();
	});

	it("opens the details drawer for a single selected row from the bulk bar", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		await user.click(screen.getAllByRole("checkbox")[2]);
		await user.click(screen.getByRole("button", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "View imaging details" });
		expect(within(dialog).getByRole("heading", { name: "Abdominal Ultrasound" })).toBeVisible();
	});
});
