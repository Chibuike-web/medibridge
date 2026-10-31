import { render, screen, within } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { format, subDays } from "date-fns";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ImagingType } from "@/features/patients/types";
import { ImagingTable } from "./imaging-table";

const uploadFetch = vi.fn();

const activeMember = vi.hoisted(() => ({ role: "owner" }));
const { createImagingMock, updateImagingMock } = vi.hoisted(() => ({
	createImagingMock: vi.fn(),
	updateImagingMock: vi.fn(),
}));

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: activeMember.role } }),
		useSession: () => ({ data: { user: { name: "Dr. Okafor" } } }),
	},
}));

vi.mock("@/features/patients/server/create-patient-imaging-action", () => ({
	createPatientImagingAction: createImagingMock,
}));

vi.mock("@/features/patients/server/update-patient-imaging-action", () => ({
	updatePatientImagingAction: updateImagingMock,
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
		files: [
			{
				id: "FILE-cxr",
				name: "chest-xray.png",
				url: "/api/patient-record-files/FILE-cxr",
				type: "image/png",
				size: "2.4 MB",
				uploadedAtLabel: "Jan 6, 2020",
			},
		],
		createdBy: "Nurse Ada",
		updatedBy: "Nurse Ada",
		createdAtLabel: "Jan 6, 2020",
		updatedAtLabel: "Jan 7, 2020",
		updatedAtValue: "2026-01-02T09:00:00.000Z",
		history: [],
	},
	{
		study: "Abdominal Ultrasound",
		imagingId: "IMG-USA",
		encounterId: "ENC-2",
		modality: "Ultrasound",
		region: "Abdomen",
		impression: "",
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
		updatedAtValue: "2026-01-02T09:00:00.000Z",
		history: [],
	},
];

function SortableImagingTable(props: React.ComponentProps<typeof ImagingTable>) {
	const [sorting, setSorting] = useState(props.sorting);
	return <ImagingTable {...props} sorting={sorting} onSortingChange={setSorting} />;
}

function renderImagingTable(overrides: Partial<React.ComponentProps<typeof ImagingTable>> = {}) {
	const props: React.ComponentProps<typeof ImagingTable> = {
		patientId: "patient-a",
		imagingStudies,
		page: 1,
		limit: 14,
		totalPages: 1,
		query: "",
		sorting: [],
		onSortingChange: vi.fn(),
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
		onFiltersClear: vi.fn(),
		onPreviousPage: vi.fn(),
		onNextPage: vi.fn(),
		onLimitChange: vi.fn(),
		...overrides,
	};

	const { rerender } = render(<SortableImagingTable {...props} />);

	return { ...props, rerender };
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
		createImagingMock.mockReset();
		updateImagingMock.mockReset();
	});

	test("reports what the user types in the search box and shows the controlled query", async () => {
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

	test("marks the study sort ascending, then descending, then clears, keeping the server's row order", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		const studyHeader = screen.getByRole("columnheader", { name: "Study" });
		expect(studyHeader).toHaveAttribute("aria-sort", "none");

		const serverOrder = displayedImagingIds();
		await user.click(studyHeader);
		expect(studyHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedImagingIds()).toEqual(serverOrder);

		await user.click(studyHeader);
		expect(studyHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedImagingIds()).toEqual(serverOrder);

		await user.click(studyHeader);
		expect(studyHeader).toHaveAttribute("aria-sort", "none");
		expect(displayedImagingIds()).toEqual(serverOrder);
	});

	test("sorts by modality and region, keeping the server's row order", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		const serverOrder = displayedImagingIds();
		await user.click(screen.getByRole("columnheader", { name: "Modality" }));
		expect(displayedImagingIds()).toEqual(serverOrder);

		await user.click(screen.getByRole("columnheader", { name: "Region" }));
		expect(screen.getByRole("columnheader", { name: "Modality" })).toHaveAttribute(
			"aria-sort",
			"none",
		);
		expect(screen.getByRole("columnheader", { name: "Region" })).toHaveAttribute(
			"aria-sort",
			"ascending",
		);
		expect(displayedImagingIds()).toEqual(serverOrder);
	});

	test("sorts by order date from the keyboard and keeps the server's row order", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		const orderedAtHeader = screen.getByRole("columnheader", { name: "Ordered At" });
		const serverOrder = displayedImagingIds();
		orderedAtHeader.focus();
		await user.keyboard("{Enter}");
		expect(orderedAtHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedImagingIds()).toEqual(serverOrder);

		await user.keyboard(" ");
		expect(orderedAtHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedImagingIds()).toEqual(serverOrder);
	});

	test("does not offer sorting on the imaging ID, impression or status columns", () => {
		renderImagingTable();

		for (const label of ["Imaging ID", "Impression", "Status"]) {
			expect(screen.getByRole("columnheader", { name: label })).not.toHaveAttribute("aria-sort");
		}
	});

	test("adds and removes status filters from the checkbox list", async () => {
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

	test("offers every modality and reports the chosen modalities", async () => {
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

	test("applies an order date preset to the ordered-at range only", async () => {
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

	test("applies a creation date preset to the created-at range only", async () => {
		const user = setupSubmenuUser();
		const { onOrderedAtRangeApply, onCreatedAtRangeApply } = renderImagingTable();

		await openFilterSubmenu(user, "Created at");
		await user.click(await screen.findByRole("menuitem", { name: "Today" }));

		const today = format(new Date(), "yyyy-MM-dd");
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith(today, today);
		expect(onOrderedAtRangeApply).not.toHaveBeenCalled();
	});

	test("shows active filters as pills that can be removed individually", async () => {
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

	test("clears every active filter at once", async () => {
		const user = userEvent.setup();
		const { onFiltersClear } = renderImagingTable({
			statusFilters: ["pending"],
			modalityFilters: ["ultrasound"],
		});

		await user.click(screen.getByRole("button", { name: "Clear all" }));
		expect(onFiltersClear).toHaveBeenCalledTimes(1);
	});

	test.todo(
		"labels modality pills the same way as the filter options (pill shows 'Modality: Ct', 'Modality: Mri' and 'Modality: X Ray' for options labelled CT, MRI and X-ray)",
	);

	test("moves between pages through the callbacks", async () => {
		const user = userEvent.setup();
		const { onNextPage, onPreviousPage } = renderImagingTable({ page: 2, totalPages: 3 });

		expect(screen.getByText("Page 2 of 3")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Next" }));
		expect(onNextPage).toHaveBeenCalledTimes(1);
		await user.click(screen.getByRole("button", { name: "Previous" }));
		expect(onPreviousPage).toHaveBeenCalledTimes(1);
	});

	test("disables going back from the first page", () => {
		renderImagingTable({ page: 1, totalPages: 3 });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
	});

	test("disables going forward from the last page", () => {
		renderImagingTable({ page: 3, totalPages: 3 });

		expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	test("disables paging while a request is pending", () => {
		renderImagingTable({ page: 2, totalPages: 3, isPending: true });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	test("lets the user change the rows per page", async () => {
		const user = userEvent.setup();
		const { onLimitChange } = renderImagingTable({ limit: 28 });

		const rowsPerPage = screen.getByRole("combobox");
		expect(rowsPerPage).toHaveTextContent("28");
		await user.click(rowsPerPage);
		await user.click(await screen.findByRole("option", { name: "42" }));
		expect(onLimitChange).toHaveBeenCalledWith(42);
	});

	test("opens the details drawer for the row chosen from its action menu", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Chest X-ray" }));
		await user.click(await screen.findByRole("menuitem", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "Imaging details" });
		expect(within(dialog).getByRole("heading", { name: "Chest X-ray" })).toBeVisible();
		expect(within(dialog).getByText("No acute cardiopulmonary findings.")).toBeVisible();
		expect(within(dialog).getByText("Chest")).toBeVisible();
		expect(within(dialog).getByText("Dr. Okafor")).toBeVisible();
		expect(within(dialog).getByText("Follow-up in six weeks.")).toBeVisible();
		expect(within(dialog).queryByText("Abdominal Ultrasound")).not.toBeInTheDocument();
	});

	test("opens the details drawer when the row itself is activated with the keyboard", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		const [, usaRow] = bodyRows();
		usaRow.focus();
		await user.keyboard("{Enter}");

		const dialog = await screen.findByRole("dialog", { name: "Imaging details" });
		expect(within(dialog).getByRole("heading", { name: "Abdominal Ultrasound" })).toBeVisible();
	});

	test("asks for confirmation before cancelling a pending study from the details drawer", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Abdominal Ultrasound" }));
		await user.click(await screen.findByRole("menuitem", { name: "View details" }));
		const drawer = await screen.findByRole("dialog", { name: "Imaging details" });
		await user.click(within(drawer).getByRole("button", { name: "Imaging actions" }));

		expect(await screen.findByRole("menuitem", { name: "Mark as completed" })).toBeVisible();
		await user.click(screen.getByRole("menuitem", { name: "Cancel imaging" }));

		const confirmation = await screen.findByRole("alertdialog", { name: "Cancel imaging?" });
		expect(within(confirmation).getByRole("button", { name: "Cancel imaging" })).toBeVisible();
	});

	test("only offers status changes for pending studies", async () => {
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

	test("shows archive actions to an owner", async () => {
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

	test("shows archive actions to an admin", async () => {
		activeMember.role = "admin";
		const user = userEvent.setup();
		renderImagingTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Chest X-ray" }));
		expect(await screen.findByRole("menuitem", { name: "Archive" })).toBeVisible();
	});

	test("hides archive actions from a member", async () => {
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

	test("selects rows for bulk actions and clears the selection", async () => {
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

	test("opens the details drawer for a single selected row from the bulk bar", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		await user.click(screen.getAllByRole("checkbox")[2]);
		await user.click(screen.getByRole("button", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "Imaging details" });
		expect(within(dialog).getByRole("heading", { name: "Abdominal Ultrasound" })).toBeVisible();
	});

	test("adds a pending imaging study to the encounter without a follow-up table request", async () => {
		createImagingMock.mockResolvedValue({ status: "success", imagingId: "IMG-new" });
		const user = userEvent.setup();
		renderImagingTable({ encounterId: "ENC-1" });
		const today = new Date();

		await user.click(screen.getByRole("button", { name: "Add imaging" }));
		const drawer = await screen.findByRole("dialog", { name: "Add imaging" });
		await user.type(within(drawer).getByLabelText(/^Study/), "CT Abdomen with Contrast");
		await user.type(within(drawer).getByLabelText(/^Region/), "Abdomen");
		await user.click(within(drawer).getByRole("combobox", { name: /Modality/ }));
		await user.click(await screen.findByRole("option", { name: "CT" }));
		await user.click(within(drawer).getByRole("combobox", { name: /Status/ }));
		await user.click(await screen.findByRole("option", { name: "Pending" }));
		await user.click(within(drawer).getByRole("button", { name: /Ordered at/ }));
		await user.click(
			await screen.findByRole("button", { name: new RegExp(format(today, "MMMM do, yyyy")) }),
		);
		await user.click(within(drawer).getByRole("button", { name: "Add imaging" }));

		const [patientId, formData] = createImagingMock.mock.calls[0] as [string, FormData];
		expect(patientId).toBe("patient-a");
		expect(Object.fromEntries(formData)).toEqual(
			expect.objectContaining({
				study: "CT Abdomen with Contrast",
				region: "Abdomen",
				modality: "CT",
				status: "Pending",
				orderedAt: format(today, "yyyy-MM-dd"),
				orderedBy: "Dr. Okafor",
				encounterId: "ENC-1",
			}),
		);
		expect(formData.getAll("files")).toEqual([]);
		expect(screen.queryByRole("dialog", { name: "Add imaging" })).not.toBeInTheDocument();
	});

	test("keeps the add imaging drawer open and shows why the study was not saved", async () => {
		createImagingMock.mockResolvedValue({
			status: "failed",
			error: "Enter the impression of a completed study.",
		});
		const user = userEvent.setup();
		renderImagingTable();

		await user.click(screen.getByRole("button", { name: "Add imaging" }));
		const drawer = await screen.findByRole("dialog", { name: "Add imaging" });
		await user.type(within(drawer).getByLabelText(/^Study/), "MRI Brain");
		await user.type(within(drawer).getByLabelText(/^Region/), "Head");
		await user.click(within(drawer).getByRole("combobox", { name: /Modality/ }));
		await user.click(await screen.findByRole("option", { name: "MRI" }));
		await user.click(within(drawer).getByRole("combobox", { name: /Status/ }));
		await user.click(await screen.findByRole("option", { name: "Completed" }));
		await user.click(within(drawer).getByRole("button", { name: "Add imaging" }));

		expect(await within(drawer).findByRole("alert")).toHaveTextContent("Select the order date.");
		expect(within(drawer).getByLabelText(/^Study/)).toHaveValue("MRI Brain");
		expect(createImagingMock).not.toHaveBeenCalled();
	});

	test("opens and downloads a saved image from the details drawer", async () => {
		const user = userEvent.setup();
		renderImagingTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Chest X-ray" }));
		await user.click(await screen.findByRole("menuitem", { name: "View details" }));
		const dialog = await screen.findByRole("dialog", { name: "Imaging details" });

		expect(within(dialog).getByText("chest-xray.png")).toBeVisible();
		expect(within(dialog).getByRole("link", { name: "Open" })).toHaveAttribute(
			"href",
			"/api/patient-record-files/FILE-cxr",
		);
		expect(within(dialog).getByRole("link", { name: "Download" })).toHaveAttribute(
			"href",
			"/api/patient-record-files/FILE-cxr?download",
		);
	});

	test("saves edits with an added image and returns to the details view", async () => {
		updateImagingMock.mockResolvedValue({ status: "success" });
		const user = userEvent.setup();
		const { rerender, ...props } = renderImagingTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Chest X-ray" }));
		await user.click(await screen.findByRole("menuitem", { name: "View details" }));
		const dialog = await screen.findByRole("dialog", { name: "Imaging details" });
		await user.click(within(dialog).getByRole("button", { name: "Imaging actions" }));
		await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
		const editDialog = await screen.findByRole("dialog", { name: "Edit imaging details" });

		const impression = within(editDialog).getByLabelText(/^Impression/);
		expect(impression).toHaveValue("No acute cardiopulmonary findings.");
		await user.clear(impression);
		await user.type(impression, "Small left pleural effusion.");
		await user.upload(
			within(editDialog).getByLabelText("Choose files to add"),
			new File(["png"], "chest-xray-lateral.png", { type: "image/png" }),
		);
		expect(within(editDialog).getByText("chest-xray.png")).toBeVisible();
		expect(within(editDialog).getByText("chest-xray-lateral.png")).toBeVisible();
		await user.click(within(editDialog).getByRole("button", { name: "Save changes" }));

		const [imagingId, formData] = updateImagingMock.mock.calls[0] as [string, FormData];
		expect(imagingId).toBe("IMG-CXR");
		expect(Object.fromEntries(formData)).toEqual(
			expect.objectContaining({
				study: "Chest X-ray",
				region: "Chest",
				modality: "X-ray",
				status: "Completed",
				orderedAt: "2020-01-05",
				impression: "Small left pleural effusion.",
			}),
		);
		expect(formData.getAll("files").map((receipt) => JSON.parse(String(receipt)).name)).toEqual([
			"chest-xray-lateral.png",
		]);
		expect(formData.getAll("removedFileIds")).toEqual([]);
		expect(await screen.findByRole("dialog", { name: "Imaging details" })).toBeVisible();
		rerender(
			<SortableImagingTable
				{...props}
				imagingStudies={imagingStudies.map((row, index) =>
					index === 0 ? { ...row, impression: "Small left pleural effusion." } : row,
				)}
			/>,
		);
		const savedDetails = screen.getByRole("dialog", { name: "Imaging details" });
		expect(within(savedDetails).getByText("Small left pleural effusion.")).toBeVisible();
	});
});
