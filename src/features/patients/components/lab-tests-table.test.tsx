import { render, screen, within } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { format, subDays } from "date-fns";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { LabTestType } from "@/features/patients/types";
import { LabTestsTable } from "./lab-tests-table";

const uploadFetch = vi.fn();

const activeMember = vi.hoisted(() => ({ role: "owner" }));
const { createLabTestMock, updateLabTestMock } = vi.hoisted(() => ({
	createLabTestMock: vi.fn(),
	updateLabTestMock: vi.fn(),
}));

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: activeMember.role } }),
		useSession: () => ({ data: { user: { name: "Dr. Okafor" } } }),
	},
}));

vi.mock("@/features/patients/server/create-patient-lab-test-action", () => ({
	createPatientLabTestAction: createLabTestMock,
}));

vi.mock("@/features/patients/server/update-patient-lab-test-action", () => ({
	updatePatientLabTestAction: updateLabTestMock,
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
		updatedAtValue: "2026-01-02T09:00:00.000Z",
		updatedAtSortValue: "2020-01-07T09:00:00.000Z",
		createdBy: "Nurse Ada",
		updatedBy: "Nurse Ada",
		status: "Completed",
		clinicalNote: "Repeat in three months.",
		files: [
			{
				id: "FILE-a1c",
				name: "a1c-report.pdf",
				url: "/api/patient-record-files/lab/FILE-a1c",
				type: "application/pdf",
				size: "120 KB",
				uploadedAtLabel: "Jan 6, 2020",
			},
		],
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
		updatedAtValue: "2026-01-02T09:00:00.000Z",
		updatedAtSortValue: "2020-01-02T09:00:00.000Z",
		createdBy: "Nurse Ada",
		updatedBy: "Nurse Ada",
		status: "Pending",
		clinicalNote: "",
		files: [],
		history: [],
	},
];

function SortableLabTestsTable(props: React.ComponentProps<typeof LabTestsTable>) {
	const [sorting, setSorting] = useState(props.sorting);
	return <LabTestsTable {...props} sorting={sorting} onSortingChange={setSorting} />;
}

function renderLabTestsTable(overrides: Partial<React.ComponentProps<typeof LabTestsTable>> = {}) {
	const props: React.ComponentProps<typeof LabTestsTable> = {
		patientId: "patient-a",
		labTests,
		page: 1,
		limit: 14,
		totalPages: 1,
		query: "",
		sorting: [],
		onSortingChange: vi.fn(),
		createdFrom: "",
		createdTo: "",
		statusFilters: [],
		flagFilters: [],
		isPending: false,
		onQueryChange: vi.fn(),
		onCreatedAtRangeApply: vi.fn(),
		onStatusFiltersChange: vi.fn(),
		onFlagFiltersChange: vi.fn(),
		onFiltersClear: vi.fn(),
		onPreviousPage: vi.fn(),
		onNextPage: vi.fn(),
		onLimitChange: vi.fn(),
		...overrides,
	};

	const { rerender } = render(<SortableLabTestsTable {...props} />);

	return { ...props, rerender };
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
	afterEach(() => vi.unstubAllGlobals());
	beforeEach(() => {
		uploadFetch.mockReset();
		uploadFetch.mockImplementation(async (url: string, options: RequestInit) =>
			url === "/api/patient-record-files/upload"
				? Response.json({
						status: "success",
						signedUrl: "https://storage.test/report",
						receipt: options.body,
					})
				: new Response(null, { status: 200 }),
		);
		vi.stubGlobal("fetch", uploadFetch);
		activeMember.role = "owner";
		createLabTestMock.mockReset();
		updateLabTestMock.mockReset();
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

	test("marks the test name sort ascending, then descending, then clears, keeping the server's row order", async () => {
		const user = userEvent.setup();
		renderLabTestsTable();

		const testHeader = screen.getByRole("columnheader", { name: "Test" });
		expect(testHeader).toHaveAttribute("aria-sort", "none");

		const serverOrder = displayedLabIds();
		await user.click(testHeader);
		expect(testHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedLabIds()).toEqual(serverOrder);

		await user.click(testHeader);
		expect(testHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedLabIds()).toEqual(serverOrder);

		await user.click(testHeader);
		expect(testHeader).toHaveAttribute("aria-sort", "none");
		expect(displayedLabIds()).toEqual(serverOrder);
	});

	test("sorts by creation date from the keyboard and keeps the server's row order", async () => {
		const user = userEvent.setup();
		renderLabTestsTable();

		const createdAtHeader = screen.getByRole("columnheader", { name: "Created at" });
		const serverOrder = displayedLabIds();
		createdAtHeader.focus();
		await user.keyboard("{Enter}");
		expect(createdAtHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedLabIds()).toEqual(serverOrder);

		await user.keyboard(" ");
		expect(createdAtHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedLabIds()).toEqual(serverOrder);
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

	test("clears every active filter at once", async () => {
		const user = userEvent.setup();
		const { onFiltersClear } = renderLabTestsTable({
			statusFilters: ["pending"],
			flagFilters: ["within-range"],
		});

		await user.click(screen.getByRole("button", { name: "Clear all" }));
		expect(onFiltersClear).toHaveBeenCalledTimes(1);
	});

	test("describes a one-sided date filter in the pill", () => {
		renderLabTestsTable({ createdFrom: "2020-01-01" });

		expect(screen.getByText("Created: From Jan 1, 2020")).toBeVisible();
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

		const dialog = await screen.findByRole("dialog", { name: "Lab test details" });
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

		const dialog = await screen.findByRole("dialog", { name: "Lab test details" });
		expect(within(dialog).getByRole("heading", { name: "Basic Metabolic Panel" })).toBeVisible();
	});

	test("confirms archiving a pending lab test from the details drawer actions menu", async () => {
		const user = userEvent.setup();
		renderLabTestsTable();

		const [, bmpRow] = bodyRows();
		bmpRow.focus();
		await user.keyboard("{Enter}");
		const drawer = await screen.findByRole("dialog", { name: "Lab test details" });
		await user.click(within(drawer).getByRole("button", { name: "Lab test actions" }));

		expect(await screen.findByRole("menuitem", { name: "Edit" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Mark as completed" })).toBeVisible();
		await user.click(screen.getByRole("menuitem", { name: "Archive" }));

		const archiveDialog = await screen.findByRole("alertdialog", { name: "Archive lab test" });
		expect(within(archiveDialog).getByRole("button", { name: "Archive lab test" })).toBeVisible();
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

		const dialog = await screen.findByRole("dialog", { name: "Lab test details" });
		expect(within(dialog).getByRole("heading", { name: "Basic Metabolic Panel" })).toBeVisible();
	});

	test("adds a pending lab test with its report to the encounter without a follow-up table request", async () => {
		createLabTestMock.mockResolvedValue({ status: "success", labTestId: "LAB-new" });
		const user = userEvent.setup();
		renderLabTestsTable({ encounterId: "ENC-1" });
		const today = new Date();

		await user.click(screen.getByRole("button", { name: "Add lab test" }));
		const drawer = await screen.findByRole("dialog", { name: "Add lab test" });
		await user.type(within(drawer).getByLabelText(/^Test/), "Full Blood Count");
		await user.click(within(drawer).getByRole("combobox", { name: /Status/ }));
		await user.click(await screen.findByRole("option", { name: "Pending" }));
		await user.click(within(drawer).getByRole("button", { name: /Ordered at/ }));
		await user.click(
			await screen.findByRole("button", { name: new RegExp(format(today, "MMMM do, yyyy")) }),
		);
		await user.type(within(drawer).getByLabelText(/Specimen/), "Whole blood");
		await user.upload(
			within(drawer).getByLabelText(/Choose one or more files/),
			new File(["%PDF-1.4"], "fbc-request.pdf", { type: "application/pdf" }),
		);
		expect(within(drawer).getByText("fbc-request.pdf")).toBeVisible();
		await user.click(within(drawer).getByRole("button", { name: "Add lab test" }));

		const [patientId, formData] = createLabTestMock.mock.calls[0] as [string, FormData];
		expect(patientId).toBe("patient-a");
		expect(Object.fromEntries(formData)).toEqual(
			expect.objectContaining({
				testName: "Full Blood Count",
				status: "Pending",
				orderedAt: format(today, "yyyy-MM-dd"),
				orderedBy: "Dr. Okafor",
				specimen: "Whole blood",
				encounterId: "ENC-1",
			}),
		);
		expect(formData.getAll("files").map((receipt) => JSON.parse(String(receipt)).name)).toEqual([
			"fbc-request.pdf",
		]);
		expect(screen.queryByRole("dialog", { name: "Add lab test" })).not.toBeInTheDocument();
	});

	test("keeps the add lab test drawer open and shows why the lab test was not saved", async () => {
		createLabTestMock.mockResolvedValue({
			status: "failed",
			error: "Attach the report for a completed lab test.",
		});
		const user = userEvent.setup();
		renderLabTestsTable();

		await user.click(screen.getByRole("button", { name: "Add lab test" }));
		const drawer = await screen.findByRole("dialog", { name: "Add lab test" });
		await user.type(within(drawer).getByLabelText(/^Test/), "Lipid panel");
		await user.click(within(drawer).getByRole("combobox", { name: /Status/ }));
		await user.click(await screen.findByRole("option", { name: "Completed" }));
		await user.type(within(drawer).getByLabelText(/Specimen/), "Serum");
		await user.click(within(drawer).getByRole("button", { name: "Add lab test" }));

		expect(await within(drawer).findByRole("alert")).toHaveTextContent("Select the order date.");
		expect(within(drawer).getByLabelText(/^Test/)).toHaveValue("Lipid panel");
		expect(createLabTestMock).not.toHaveBeenCalled();
	});

	test("opens and downloads a saved lab report from the details drawer", async () => {
		const user = userEvent.setup();
		renderLabTestsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Hemoglobin A1c" }));
		await user.click(await screen.findByRole("menuitem", { name: "View details" }));
		const dialog = await screen.findByRole("dialog", { name: "Lab test details" });

		expect(within(dialog).getByText("a1c-report.pdf")).toBeVisible();
		expect(within(dialog).getByRole("link", { name: "Open" })).toHaveAttribute(
			"href",
			"/api/patient-record-files/lab/FILE-a1c",
		);
		expect(within(dialog).getByRole("link", { name: "Download" })).toHaveAttribute(
			"href",
			"/api/patient-record-files/lab/FILE-a1c?download",
		);
	});

	test("saves edits with a replaced report and returns to the details view", async () => {
		updateLabTestMock.mockResolvedValue({ status: "success" });
		const user = userEvent.setup();
		const { rerender, ...props } = renderLabTestsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Hemoglobin A1c" }));
		await user.click(await screen.findByRole("menuitem", { name: "View details" }));
		const dialog = await screen.findByRole("dialog", { name: "Lab test details" });
		await user.click(within(dialog).getByRole("button", { name: "Lab test actions" }));
		await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
		const editDialog = await screen.findByRole("dialog", { name: "Edit lab test details" });

		const resultInput = within(editDialog).getByLabelText(/^Result/);
		expect(resultInput).toHaveValue("6.1 %");
		await user.clear(resultInput);
		await user.type(resultInput, "5.4 %");
		await user.click(within(editDialog).getByRole("button", { name: "Remove" }));
		await user.click(within(editDialog).getByRole("button", { name: "Remove file" }));
		expect(within(editDialog).queryByText("a1c-report.pdf")).not.toBeInTheDocument();
		await user.upload(
			within(editDialog).getByLabelText(/Choose one or more files/),
			new File(["%PDF-1.4"], "a1c-repeat.pdf", { type: "application/pdf" }),
		);
		expect(within(editDialog).getByText(/Not saved yet/)).toBeVisible();
		await user.click(within(editDialog).getByRole("button", { name: "Save changes" }));

		const [labTestId, formData] = updateLabTestMock.mock.calls[0] as [string, FormData];
		expect(labTestId).toBe("LAB-A1C");
		expect(Object.fromEntries(formData)).toEqual(
			expect.objectContaining({
				testName: "Hemoglobin A1c",
				status: "Completed",
				flag: "High",
				result: "5.4 %",
				orderedAt: "2020-01-05",
				removedFileIds: "FILE-a1c",
			}),
		);
		expect(formData.getAll("files").map((receipt) => JSON.parse(String(receipt)).name)).toEqual([
			"a1c-repeat.pdf",
		]);
		expect(await screen.findByRole("dialog", { name: "Lab test details" })).toBeVisible();
		rerender(
			<SortableLabTestsTable
				{...props}
				labTests={labTests.map((row, index) => (index === 0 ? { ...row, result: "5.4 %" } : row))}
			/>,
		);
		const savedDetails = screen.getByRole("dialog", { name: "Lab test details" });
		expect(within(savedDetails).getByText("5.4 %")).toBeVisible();
	});
});
