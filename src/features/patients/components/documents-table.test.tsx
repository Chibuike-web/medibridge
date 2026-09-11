import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format, subDays } from "date-fns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentType } from "@/features/patients/types";
import { DocumentsTable } from "./documents-table";

const activeMember = vi.hoisted(() => ({ role: "owner" }));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: activeMember.role } }),
	},
}));

vi.mock("@/features/patients/server/create-patient-document-action", () => ({
	createPatientDocumentAction: vi.fn(),
}));

vi.mock("@/features/patients/server/remove-patient-document-action", () => ({
	removePatientDocumentAction: vi.fn(),
}));

vi.mock("@/features/patients/server/update-patient-document-action", () => ({
	updatePatientDocumentAction: vi.fn(),
}));

const documents: DocumentType[] = [
	{
		documentId: "DOC-CBC",
		encounterId: "ENC-1",
		title: "Complete Blood Count Report",
		documentType: "Lab Report",
		clinicalNotes: "Reviewed by haematology.",
		files: [
			{
				name: "cbc-report.pdf",
				type: "application/pdf",
				url: "/files/cbc-report.pdf",
				size: "1.2 MB",
				uploadedAt: "2020-01-06T10:00:00.000Z",
			},
		],
		createdBy: "Nurse Ada",
		updatedBy: "Dr. Okafor",
		createdAtLabel: "Jan 6, 2020",
		updatedAtLabel: "Jan 7, 2020",
		createdAtSortValue: "2020-01-06T10:00:00.000Z",
	},
	{
		documentId: "DOC-USI",
		encounterId: "ENC-2",
		title: "Abdominal Ultrasound Images",
		documentType: "Imaging",
		clinicalNotes: "-",
		files: [
			{
				name: "abdomen.png",
				type: "image/png",
				url: "/files/abdomen.png",
				size: "840 KB",
				uploadedAt: "2020-01-02T08:30:00.000Z",
			},
		],
		createdBy: "Nurse Ada",
		updatedBy: "Nurse Ada",
		createdAtLabel: "Jan 2, 2020",
		updatedAtLabel: "Jan 2, 2020",
		createdAtSortValue: "2020-01-02T08:30:00.000Z",
	},
];

function renderDocumentsTable(
	overrides: Partial<React.ComponentProps<typeof DocumentsTable>> = {},
) {
	const props: React.ComponentProps<typeof DocumentsTable> = {
		patientId: "patient-a",
		documents,
		page: 1,
		limit: 14,
		totalPages: 1,
		query: "",
		createdFrom: "",
		createdTo: "",
		documentTypeFilters: [],
		isPending: false,
		onQueryChange: vi.fn(),
		onDocumentTypeFiltersChange: vi.fn(),
		onCreatedAtRangeApply: vi.fn(),
		onPreviousPage: vi.fn(),
		onNextPage: vi.fn(),
		onLimitChange: vi.fn(),
		onDocumentsChanged: vi.fn(),
		...overrides,
	};

	render(<DocumentsTable {...props} />);

	return props;
}

function bodyRows() {
	return Array.from(screen.getByRole("table").querySelectorAll("tbody tr")) as HTMLElement[];
}

function displayedDocumentIds() {
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

describe("Documents table", () => {
	beforeEach(() => {
		activeMember.role = "owner";
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: RequestInfo | URL) => {
				const documentId = decodeURIComponent(String(input).split("/").pop() ?? "");
				const document = documents.find((item) => item.documentId === documentId) ?? null;
				return new Response(JSON.stringify({ document }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("shows each document with its type and creation date", () => {
		renderDocumentsTable();

		expect(screen.getByRole("heading", { name: "Documents" })).toBeVisible();
		for (const label of ["Document", "Document ID", "Document Type", "Created At"]) {
			expect(screen.getByRole("columnheader", { name: label })).toBeVisible();
		}
		expect(displayedDocumentIds()).toEqual(["DOC-CBC", "DOC-USI"]);

		const [cbcRow, usiRow] = bodyRows();
		expect(within(cbcRow).getByText("Complete Blood Count Report")).toBeVisible();
		expect(within(cbcRow).getByText("Lab Report")).toBeVisible();
		expect(within(cbcRow).getByText("Jan 6, 2020")).toBeVisible();
		expect(within(cbcRow).getByRole("button", { name: "Copy DOC-CBC" })).toBeVisible();

		expect(within(usiRow).getByText("Abdominal Ultrasound Images")).toBeVisible();
		expect(within(usiRow).getByText("Imaging")).toBeVisible();
		expect(within(usiRow).getByText("Jan 2, 2020")).toBeVisible();
	});

	it("shows the empty state when there are no documents", () => {
		renderDocumentsTable({ documents: [] });

		expect(screen.getByText("No matching documents found.")).toBeVisible();
		expect(bodyRows()).toHaveLength(1);
	});

	it("reports what the user types in the search box and shows the controlled query", async () => {
		const user = userEvent.setup();
		const { onQueryChange } = renderDocumentsTable({ query: "Bloo" });

		const search = screen.getByRole("searchbox");
		expect(search).toHaveAttribute("placeholder", "Search by name, document ID, or encounter ID");
		expect(search).toHaveValue("Bloo");
		await user.type(search, "d");
		expect(onQueryChange).toHaveBeenCalledWith("Blood");
	});

	it("drops the encounter ID hint from the search box when scoped to an encounter", () => {
		renderDocumentsTable({ isEncounterScoped: true });

		expect(screen.getByRole("searchbox")).toHaveAttribute(
			"placeholder",
			"Search by name or document ID",
		);
	});

	it("sorts rows by title when the header is clicked, then reverses, then clears", async () => {
		const user = userEvent.setup();
		renderDocumentsTable();

		const titleHeader = screen.getByRole("columnheader", { name: "Document" });
		expect(titleHeader).toHaveAttribute("aria-sort", "none");

		await user.click(titleHeader);
		expect(titleHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedDocumentIds()).toEqual(["DOC-USI", "DOC-CBC"]);

		await user.click(titleHeader);
		expect(titleHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedDocumentIds()).toEqual(["DOC-CBC", "DOC-USI"]);

		await user.click(titleHeader);
		expect(titleHeader).toHaveAttribute("aria-sort", "none");
		expect(displayedDocumentIds()).toEqual(["DOC-CBC", "DOC-USI"]);
	});

	it("sorts by document type", async () => {
		const user = userEvent.setup();
		renderDocumentsTable();

		const typeHeader = screen.getByRole("columnheader", { name: "Document Type" });
		await user.click(typeHeader);
		expect(typeHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedDocumentIds()).toEqual(["DOC-USI", "DOC-CBC"]);
	});

	it("sorts by creation date chronologically using the keyboard", async () => {
		const user = userEvent.setup();
		renderDocumentsTable();

		const createdAtHeader = screen.getByRole("columnheader", { name: "Created At" });
		createdAtHeader.focus();
		await user.keyboard("{Enter}");
		expect(createdAtHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedDocumentIds()).toEqual(["DOC-USI", "DOC-CBC"]);

		await user.keyboard(" ");
		expect(createdAtHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedDocumentIds()).toEqual(["DOC-CBC", "DOC-USI"]);
	});

	it("does not offer sorting on the document ID column", () => {
		renderDocumentsTable();

		expect(screen.getByRole("columnheader", { name: "Document ID" })).not.toHaveAttribute(
			"aria-sort",
		);
	});

	it("offers every document type and adds the ticked type to the filters", async () => {
		const user = setupSubmenuUser();
		const { onDocumentTypeFiltersChange } = renderDocumentsTable({
			documentTypeFilters: ["Imaging"],
		});

		await openFilterSubmenu(user, "Document Type");

		for (const label of [
			"Lab Report",
			"Imaging",
			"Cardiology",
			"Clinical Summary",
			"Referral",
			"Pathology",
		]) {
			expect(await screen.findByRole("checkbox", { name: label })).toBeVisible();
		}
		expect(screen.getByRole("checkbox", { name: "Imaging" })).toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Lab Report" })).not.toBeChecked();

		await user.click(screen.getByRole("checkbox", { name: "Lab Report" }));
		expect(onDocumentTypeFiltersChange).toHaveBeenCalledWith(["Imaging", "Lab Report"]);
	});

	it("removes a document type filter when its checkbox is unticked", async () => {
		const user = setupSubmenuUser();
		const { onDocumentTypeFiltersChange } = renderDocumentsTable({
			documentTypeFilters: ["Imaging", "Referral"],
		});

		await openFilterSubmenu(user, "Document Type");
		await user.click(await screen.findByRole("checkbox", { name: "Imaging" }));
		expect(onDocumentTypeFiltersChange).toHaveBeenCalledWith(["Referral"]);
	});

	it("applies a creation date preset as a from/to range", async () => {
		const user = setupSubmenuUser();
		const { onCreatedAtRangeApply } = renderDocumentsTable();

		await openFilterSubmenu(user, "Created at");
		await user.click(await screen.findByRole("menuitem", { name: "Last 7 days" }));

		const today = new Date();
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith(
			format(subDays(today, 6), "yyyy-MM-dd"),
			format(today, "yyyy-MM-dd"),
		);
	});

	it("applies a custom creation date range picked from the calendar", async () => {
		const user = setupSubmenuUser();
		const { onCreatedAtRangeApply } = renderDocumentsTable();

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

	it("clears the creation date range from the calendar reset button", async () => {
		const user = setupSubmenuUser();
		const { onCreatedAtRangeApply } = renderDocumentsTable({
			createdFrom: "2020-01-01",
			createdTo: "2020-01-31",
		});

		await openFilterSubmenu(user, "Created at");
		expect(await screen.findByText("01/01/2020")).toBeVisible();
		expect(screen.getByText("31/01/2020")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Reset" }));
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith("", "");
	});

	it("shows active filters as pills that can be removed individually", async () => {
		const user = userEvent.setup();
		const { onCreatedAtRangeApply, onDocumentTypeFiltersChange } = renderDocumentsTable({
			createdFrom: "2020-01-01",
			createdTo: "2020-01-31",
			documentTypeFilters: ["Lab Report", "Referral"],
		});

		expect(screen.getByText("Document type: Lab Report")).toBeVisible();
		expect(screen.getByText("Document type: Referral")).toBeVisible();
		expect(screen.getByText("Created: Jan 1, 2020 - Jan 31, 2020")).toBeVisible();

		await user.click(
			screen.getByRole("button", { name: "Remove Document type: Lab Report filter" }),
		);
		expect(onDocumentTypeFiltersChange).toHaveBeenCalledWith(["Referral"]);

		await user.click(
			screen.getByRole("button", { name: "Remove Created: Jan 1, 2020 - Jan 31, 2020 filter" }),
		);
		expect(onCreatedAtRangeApply).toHaveBeenCalledWith("", "");
	});

	it("describes a one-sided date filter in the pill", () => {
		renderDocumentsTable({ createdTo: "2020-01-31" });

		expect(screen.getByText("Created: Until Jan 31, 2020")).toBeVisible();
	});

	it("shows no filter pills when no filter is active", () => {
		renderDocumentsTable();

		expect(screen.queryByRole("button", { name: /^Remove .* filter$/ })).not.toBeInTheDocument();
	});

	it("moves between pages through the callbacks", async () => {
		const user = userEvent.setup();
		const { onNextPage, onPreviousPage } = renderDocumentsTable({ page: 2, totalPages: 3 });

		expect(screen.getByText("Page 2 of 3")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Next" }));
		expect(onNextPage).toHaveBeenCalledTimes(1);
		await user.click(screen.getByRole("button", { name: "Previous" }));
		expect(onPreviousPage).toHaveBeenCalledTimes(1);
	});

	it("disables going back from the first page", () => {
		renderDocumentsTable({ page: 1, totalPages: 3 });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
	});

	it("disables going forward from the last page", () => {
		renderDocumentsTable({ page: 3, totalPages: 3 });

		expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	it("disables paging while a request is pending", () => {
		renderDocumentsTable({ page: 2, totalPages: 3, isPending: true });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	it("lets the user change the rows per page", async () => {
		const user = userEvent.setup();
		const { onLimitChange } = renderDocumentsTable({ limit: 14 });

		const rowsPerPage = screen.getByRole("combobox");
		expect(rowsPerPage).toHaveTextContent("14");
		await user.click(rowsPerPage);
		await user.click(await screen.findByRole("option", { name: "42" }));
		expect(onLimitChange).toHaveBeenCalledWith(42);
	});

	it("opens the details drawer with the chosen document's details and files", async () => {
		const user = userEvent.setup();
		renderDocumentsTable();

		await user.click(
			screen.getByRole("button", { name: "Open actions for Complete Blood Count Report" }),
		);
		await user.click(await screen.findByRole("menuitem", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "View document details" });
		expect(
			await within(dialog).findByRole("heading", { name: "Complete Blood Count Report" }),
		).toBeVisible();
		expect(within(dialog).getByText("Lab Report")).toBeVisible();
		expect(within(dialog).getByText("Reviewed by haematology.")).toBeVisible();
		expect(within(dialog).getByText("Dr. Okafor")).toBeVisible();
		expect(within(dialog).getByText("cbc-report.pdf")).toBeVisible();
		expect(within(dialog).getByText("1.2 MB • Uploaded on 2020-01-06")).toBeVisible();
		expect(within(dialog).getByRole("link", { name: "Open" })).toHaveAttribute(
			"href",
			"/files/cbc-report.pdf",
		);
		expect(within(dialog).queryByText("Abdominal Ultrasound Images")).not.toBeInTheDocument();
	});

	it("loads a different document when another row is opened", async () => {
		const user = userEvent.setup();
		renderDocumentsTable();

		await user.click(
			screen.getByRole("button", { name: "Open actions for Complete Blood Count Report" }),
		);
		await user.click(await screen.findByRole("menuitem", { name: "View details" }));
		expect(
			await screen.findByRole("heading", { name: "Complete Blood Count Report" }),
		).toBeVisible();
		await user.keyboard("{Escape}");

		await user.click(
			screen.getByRole("button", { name: "Open actions for Abdominal Ultrasound Images" }),
		);
		await user.click(await screen.findByRole("menuitem", { name: "Open" }));

		expect(
			await screen.findByRole("heading", { name: "Abdominal Ultrasound Images" }),
		).toBeVisible();
		expect(screen.getByText("abdomen.png")).toBeVisible();
		expect(screen.getByText("840 KB • Uploaded on 2020-01-02")).toBeVisible();
	});

	it("opens the details drawer when the row itself is activated with the keyboard", async () => {
		const user = userEvent.setup();
		renderDocumentsTable();

		const [, usiRow] = bodyRows();
		usiRow.focus();
		await user.keyboard("{Enter}");

		const dialog = await screen.findByRole("dialog", { name: "View document details" });
		expect(
			await within(dialog).findByRole("heading", { name: "Abdominal Ultrasound Images" }),
		).toBeVisible();
	});

	it("offers view, open, export and remove actions on every row regardless of role", async () => {
		activeMember.role = "member";
		const user = userEvent.setup();
		renderDocumentsTable();

		await user.click(
			screen.getByRole("button", { name: "Open actions for Complete Blood Count Report" }),
		);
		for (const label of ["View details", "Open", "Export", "Remove"]) {
			expect(await screen.findByRole("menuitem", { name: label })).toBeVisible();
		}
		expect(screen.queryByRole("menuitem", { name: "Archive" })).not.toBeInTheDocument();
	});

	it("opens the create drawer from the add button", async () => {
		const user = userEvent.setup();
		renderDocumentsTable();

		await user.click(screen.getByRole("button", { name: "Add document" }));
		expect(await screen.findByRole("dialog", { name: "Add document" })).toBeVisible();
	});

	it("shows the bulk archive action to an owner", async () => {
		const user = userEvent.setup();
		renderDocumentsTable();

		await user.click(screen.getAllByRole("checkbox")[1]);
		const bar = bulkActionBar();
		expect(within(bar).getByText("1 item selected")).toBeVisible();
		expect(within(bar).getByRole("button", { name: "Archive" })).toBeVisible();
	});

	it("shows the bulk archive action to an admin", async () => {
		activeMember.role = "admin";
		const user = userEvent.setup();
		renderDocumentsTable();

		await user.click(screen.getAllByRole("checkbox")[1]);
		expect(within(bulkActionBar()).getByRole("button", { name: "Archive" })).toBeVisible();
	});

	it("hides the bulk archive action from a member", async () => {
		activeMember.role = "member";
		const user = userEvent.setup();
		renderDocumentsTable();

		await user.click(screen.getAllByRole("checkbox")[1]);
		const bar = bulkActionBar();
		expect(within(bar).getByText("1 item selected")).toBeVisible();
		expect(within(bar).getByRole("button", { name: "Export" })).toBeVisible();
		expect(within(bar).queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
	});

	it("selects rows for bulk actions and clears the selection", async () => {
		const user = userEvent.setup();
		renderDocumentsTable();

		const [selectAll, firstRow] = screen.getAllByRole("checkbox");
		await user.click(firstRow);
		expect(screen.getByText("1 item selected")).toBeVisible();
		expect(screen.getByRole("button", { name: "View details" })).toBeVisible();

		await user.click(selectAll);
		expect(screen.getByText("2 items selected")).toBeVisible();
		expect(screen.queryByRole("button", { name: "View details" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Archive all" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Clear selected documents" }));
		expect(screen.queryByText(/items? selected/)).not.toBeInTheDocument();
	});

	it("opens the details drawer for a single selected row from the bulk bar", async () => {
		const user = userEvent.setup();
		renderDocumentsTable();

		await user.click(screen.getAllByRole("checkbox")[2]);
		await user.click(screen.getByRole("button", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "View document details" });
		expect(
			await within(dialog).findByRole("heading", { name: "Abdominal Ultrasound Images" }),
		).toBeVisible();
	});
});
