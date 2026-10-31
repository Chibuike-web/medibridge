import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { format, subDays } from "date-fns";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ImmunizationDetailsType, ImmunizationType } from "@/features/patients/types";
import { ImmunizationsTable } from "./immunizations-table";

const authState = vi.hoisted(() => ({ role: "owner" }));
const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));
const { createPatientImmunizationMock, updateImmunizationMock } = vi.hoisted(() => ({
	createPatientImmunizationMock: vi.fn(),
	updateImmunizationMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: authState.role } }),
		useSession: () => ({ data: { user: { name: "Nurse Chika" } } }),
	},
}));

vi.mock("@/features/patients/server/create-patient-immunization-action", () => ({
	createPatientImmunizationAction: createPatientImmunizationMock,
}));

vi.mock("@/features/patients/server/update-patient-immunization-action", () => ({
	updatePatientImmunizationAction: updateImmunizationMock,
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
		editValues: {
			updatedAt: "2026-01-02T09:00:00.000Z",
			seriesType: "Primary",
			currentDose: "3",
			totalDoses: "3",
			dateAdministered: "2024-01-12",
			administeredBy: "Nurse Ada Eze",
			clinicalNote: "No adverse reaction observed.",
		},
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
		editValues: {
			updatedAt: "2026-01-02T09:00:00.000Z",
			seriesType: "Booster",
			currentDose: "2",
			totalDoses: "3",
			dateAdministered: "2024-03-05",
			administeredBy: "Nurse Kemi Ojo",
			clinicalNote: "",
		},
		history: [],
	},
};

function SortableImmunizationsTable(props: React.ComponentProps<typeof ImmunizationsTable>) {
	const [sorting, setSorting] = useState(props.sorting);
	return <ImmunizationsTable {...props} sorting={sorting} onSortingChange={setSorting} />;
}

function renderImmunizationsTable(
	overrides: Partial<React.ComponentProps<typeof ImmunizationsTable>> = {},
) {
	const props: React.ComponentProps<typeof ImmunizationsTable> = {
		patientId: "patient-1",
		immunizations,
		page: 1,
		limit: 14,
		totalPages: 1,
		query: "",
		sorting: [],
		onSortingChange: vi.fn(),
		createdFrom: "",
		createdTo: "",
		statusFilters: [],
		isPending: false,
		onQueryChange: vi.fn(),
		onCreatedAtRangeApply: vi.fn(),
		onStatusFiltersChange: vi.fn(),
		onFiltersClear: vi.fn(),
		onPreviousPage: vi.fn(),
		onNextPage: vi.fn(),
		onLimitChange: vi.fn(),
		...overrides,
	};

	render(
		<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
			<SortableImmunizationsTable {...props} />
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

describe("Immunizations table", () => {
	let savedImmunizationDetails: typeof immunizationDetailsById;

	beforeEach(() => {
		authState.role = "owner";
		createPatientImmunizationMock.mockReset();
		updateImmunizationMock.mockReset();
		savedImmunizationDetails = { ...immunizationDetailsById };
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: string) => {
				const immunizationId = decodeURIComponent(input.split("/").pop() ?? "");
				return {
					ok: true,
					json: async () => ({
						immunization: savedImmunizationDetails[immunizationId] ?? null,
					}),
				};
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	test("reports what the user types in the search box", async () => {
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

	test("marks the vaccine name sort when clicked and keeps the server's row order", async () => {
		const user = userEvent.setup();
		renderImmunizationsTable();

		expect(displayedIds()).toEqual(["IMM-3001", "IMM-1001"]);

		const vaccineHeader = screen.getByRole("columnheader", { name: "Vaccine name" });
		const serverOrder = displayedIds();
		await user.click(vaccineHeader);
		expect(vaccineHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedIds()).toEqual(serverOrder);

		await user.click(vaccineHeader);
		expect(vaccineHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedIds()).toEqual(serverOrder);
	});

	test("sorts by creation date from the keyboard and keeps the server's row order", async () => {
		const user = userEvent.setup();
		renderImmunizationsTable();

		const createdHeader = screen.getByRole("columnheader", { name: "Created At" });
		const serverOrder = displayedIds();
		createdHeader.focus();
		await user.keyboard("{Enter}");
		expect(createdHeader).toHaveAttribute("aria-sort", "ascending");
		expect(displayedIds()).toEqual(serverOrder);
		await user.keyboard(" ");
		expect(createdHeader).toHaveAttribute("aria-sort", "descending");
		expect(displayedIds()).toEqual(serverOrder);
	});

	test("does not allow sorting by immunization ID, dose or status", () => {
		renderImmunizationsTable();

		for (const label of ["Immunization ID", "Dose", "Status"]) {
			expect(screen.getByRole("columnheader", { name: label })).not.toHaveAttribute("aria-sort");
		}
	});

	test("adds and removes status filters from the Status submenu", async () => {
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

	test("applies a created-at preset as a from/to range", async () => {
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

	test("shows active filters as pills the user can remove", async () => {
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

	test("clears every active filter at once", async () => {
		const user = userEvent.setup();
		const { onFiltersClear } = renderImmunizationsTable({
			statusFilters: ["active"],
			createdFrom: "2024-01-01",
		});

		await user.click(screen.getByRole("button", { name: "Clear all" }));
		expect(onFiltersClear).toHaveBeenCalledTimes(1);
	});

	test("paginates through the owner callbacks and shows the current page", async () => {
		const user = userEvent.setup();
		const { onNextPage, onPreviousPage } = renderImmunizationsTable({ page: 3, totalPages: 5 });

		expect(screen.getByText("Page 3 of 5")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Next" }));
		expect(onNextPage).toHaveBeenCalledTimes(1);
		await user.click(screen.getByRole("button", { name: "Previous" }));
		expect(onPreviousPage).toHaveBeenCalledTimes(1);
	});

	test("disables Previous on the first page and Next on the last page", () => {
		renderImmunizationsTable({ page: 1, totalPages: 1 });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	test("disables paging and the rows-per-page picker while a request is pending", () => {
		renderImmunizationsTable({ page: 2, totalPages: 3, isPending: true });

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
		expect(rowsPerPagePicker()).toBeDisabled();
	});

	test("lets the user change the rows per page", async () => {
		const user = userEvent.setup();
		const { onLimitChange } = renderImmunizationsTable();

		const picker = rowsPerPagePicker();
		expect(picker).toHaveTextContent("14");
		await user.click(picker);
		await user.click(await screen.findByRole("option", { name: "42" }));
		expect(onLimitChange).toHaveBeenCalledWith(42);
	});

	test.each([401, 403])(
		"refreshes page access checks when opening details returns HTTP %s",
		async (status) => {
			let finishRequest: (response: Response) => void = () => {};
			const fetchMock = vi.fn(
				() =>
					new Promise<Response>((resolve) => {
						finishRequest = resolve;
					}),
			);
			vi.stubGlobal("fetch", fetchMock);
			const user = userEvent.setup();
			renderImmunizationsTable();
			expect(screen.getByText("Hepatitis B")).toBeVisible();
			await user.click(screen.getByRole("button", { name: "Open actions for Hepatitis B" }));
			await user.click(screen.getByRole("menuitem", { name: "View details" }));
			vi.useFakeTimers();
			await act(async () => {
				finishRequest(
					Response.json({ status: "failed", error: "Access unavailable." }, { status }),
				);
				await vi.advanceTimersByTimeAsync(60_000);
			});
			expect(refreshMock).toHaveBeenCalledOnce();
			expect(fetchMock).toHaveBeenCalledTimes(1);
		},
	);

	test("opens the details drawer with that immunization's data from the row actions", async () => {
		const user = userEvent.setup();
		renderImmunizationsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Hepatitis B" }));
		expect(await screen.findByRole("menuitem", { name: "Export" })).toBeVisible();
		await user.click(screen.getByRole("menuitem", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "Immunization details" });
		expect(await within(dialog).findByRole("heading", { name: "Hepatitis B" })).toBeVisible();
		expect(within(dialog).getByText("Primary series")).toBeVisible();
		expect(within(dialog).getByText("Nurse Ada Eze")).toBeVisible();
		expect(within(dialog).getByText("No adverse reaction observed.")).toBeVisible();
		expect(within(dialog).getByRole("button", { name: "Copy ENC-1001" })).toBeVisible();
	});

	test("opens the details drawer when a row is activated from the keyboard", async () => {
		const user = userEvent.setup();
		renderImmunizationsTable();

		const [firstRow] = bodyRows();
		firstRow.focus();
		await user.keyboard("{Enter}");

		const dialog = await screen.findByRole("dialog", { name: "Immunization details" });
		expect(await within(dialog).findByRole("heading", { name: "Tetanus toxoid" })).toBeVisible();
		expect(within(dialog).getByText("Booster")).toBeVisible();
		expect(within(dialog).getByText("Nurse Kemi Ojo")).toBeVisible();
	});

	test("only offers status changes on active immunizations", async () => {
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

	test("asks to confirm before discontinuing an active immunization from the details actions menu", async () => {
		const user = userEvent.setup();
		renderImmunizationsTable();

		await user.click(screen.getByRole("button", { name: "Open actions for Tetanus toxoid" }));
		await user.click(screen.getByRole("menuitem", { name: "View details" }));
		const dialog = await screen.findByRole("dialog", { name: "Immunization details" });
		await within(dialog).findByRole("heading", { name: "Tetanus toxoid" });

		await user.click(within(dialog).getByRole("button", { name: "Immunization actions" }));
		expect(await screen.findByRole("menuitem", { name: "Mark as completed" })).toBeVisible();
		await user.click(screen.getByRole("menuitem", { name: "Discontinue" }));

		const confirmation = await screen.findByRole("alertdialog", {
			name: "Discontinue immunization?",
		});
		expect(
			within(confirmation).getByText(/removed from the patient’s active immunization list/),
		).toBeVisible();

		await user.click(within(confirmation).getByRole("button", { name: "Cancel" }));
		expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
		expect(screen.getByRole("dialog", { name: "Immunization details" })).toBeVisible();
	});

	test("offers Archive to an admin in the row actions and the bulk bar", async () => {
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

	test("hides Archive from a member in the row actions and the bulk bar", async () => {
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

	test("opens the selected immunization's details from the bulk bar", async () => {
		const user = userEvent.setup();
		renderImmunizationsTable();

		const [, secondRow] = bodyRows();
		await user.click(within(secondRow).getByRole("checkbox"));
		await user.click(screen.getByRole("button", { name: "View details" }));

		const dialog = await screen.findByRole("dialog", { name: "Immunization details" });
		expect(await within(dialog).findByRole("heading", { name: "Hepatitis B" })).toBeVisible();
	});

	test("adds an immunization to the encounter it was opened from without a follow-up table request", async () => {
		createPatientImmunizationMock.mockResolvedValue({
			status: "success",
			immunizationId: "IMM-new",
		});
		const user = userEvent.setup();
		renderImmunizationsTable({ encounterId: "ENC-1" });
		const today = new Date();

		await user.click(screen.getByRole("button", { name: "Add immunization" }));
		const drawer = await screen.findByRole("dialog", { name: "Add immunization" });
		await user.type(within(drawer).getByLabelText(/Vaccine name/), "Hepatitis B");
		await user.type(within(drawer).getByLabelText(/Current Dose/), "2");
		await user.type(within(drawer).getByLabelText(/Total Dosage/), "3");
		await user.click(within(drawer).getByRole("combobox", { name: /Status/ }));
		await user.click(await screen.findByRole("option", { name: "Active" }));
		await user.click(within(drawer).getByRole("button", { name: /Date administered/ }));
		await user.click(
			await screen.findByRole("button", { name: new RegExp(format(today, "MMMM do, yyyy")) }),
		);
		expect(within(drawer).getByLabelText(/Administered by/)).toHaveValue("Nurse Chika");
		await user.click(within(drawer).getByRole("button", { name: "Add immunization" }));

		expect(createPatientImmunizationMock).toHaveBeenCalledTimes(1);
		const [patientId, formData] = createPatientImmunizationMock.mock.calls[0] as [string, FormData];
		expect(patientId).toBe("patient-1");
		expect(Object.fromEntries(formData)).toEqual(
			expect.objectContaining({
				vaccineName: "Hepatitis B",
				currentDose: "2",
				totalDoses: "3",
				status: "Active",
				dateAdministered: format(today, "yyyy-MM-dd"),
				administeredBy: "Nurse Chika",
				encounterId: "ENC-1",
			}),
		);
		expect(screen.queryByRole("dialog", { name: "Add immunization" })).not.toBeInTheDocument();
	});

	test("keeps the add immunization drawer open and shows why it was not saved", async () => {
		createPatientImmunizationMock.mockResolvedValue({
			status: "failed",
			error: "The current dose can’t be more than the total doses.",
		});
		const user = userEvent.setup();
		renderImmunizationsTable();

		await user.click(screen.getByRole("button", { name: "Add immunization" }));
		const drawer = await screen.findByRole("dialog", { name: "Add immunization" });
		await user.type(within(drawer).getByLabelText(/Vaccine name/), "BCG");
		await user.type(within(drawer).getByLabelText(/Current Dose/), "3");
		await user.type(within(drawer).getByLabelText(/Total Dosage/), "1");
		await user.click(within(drawer).getByRole("combobox", { name: /Status/ }));
		await user.click(await screen.findByRole("option", { name: "Completed" }));
		await user.click(within(drawer).getByRole("button", { name: "Add immunization" }));

		expect(await within(drawer).findByRole("alert")).toHaveTextContent(
			"The current dose can’t be more than the total doses.",
		);
		expect(within(drawer).getByLabelText(/Vaccine name/)).toHaveValue("BCG");
	});

	async function openImmunizationEditForm(user: ReturnType<typeof userEvent.setup>) {
		await user.click(screen.getByRole("button", { name: "Open actions for Tetanus toxoid" }));
		await user.click(screen.getByRole("menuitem", { name: "View details" }));
		const dialog = await screen.findByRole("dialog", { name: "Immunization details" });
		await within(dialog).findByRole("heading", { name: "Tetanus toxoid" });
		await user.click(within(dialog).getByRole("button", { name: "Immunization actions" }));
		await user.click(screen.getByRole("menuitem", { name: "Edit" }));

		return screen.findByRole("dialog", { name: "Edit immunization details" });
	}

	test("saves edits from the details drawer and shows the saved immunization", async () => {
		updateImmunizationMock.mockImplementation(async () => {
			savedImmunizationDetails["IMM-3001"] = {
				...savedImmunizationDetails["IMM-3001"],
				administeredBy: "Nurse Bisi Ade",
			};
			return { status: "success" };
		});
		const user = userEvent.setup();
		renderImmunizationsTable();

		const editDialog = await openImmunizationEditForm(user);
		const changedField = within(editDialog).getByLabelText(/Administered by/);
		await user.clear(changedField);
		await user.type(changedField, "Nurse Bisi Ade");
		await user.click(within(editDialog).getByRole("button", { name: "Save changes" }));

		const [recordId, formData] = updateImmunizationMock.mock.calls[0] as [string, FormData];
		expect(recordId).toBe("IMM-3001");
		expect(Object.fromEntries(formData)).toEqual(
			expect.objectContaining({
				vaccineName: "Tetanus toxoid",
				seriesType: "Booster",
				currentDose: "2",
				totalDoses: "3",
				status: "Active",
				dateAdministered: "2024-03-05",
				administeredBy: "Nurse Bisi Ade",
				clinicalNote: "",
			}),
		);
		const viewDialog = await screen.findByRole("dialog", { name: "Immunization details" });
		expect(await within(viewDialog).findByText("Nurse Bisi Ade")).toBeVisible();
	});

	test("keeps the immunization edit form open and shows why the changes were not saved", async () => {
		updateImmunizationMock.mockResolvedValue({
			status: "failed",
			error: "The current dose can’t be more than the total doses.",
		});
		const user = userEvent.setup();
		renderImmunizationsTable();

		const editDialog = await openImmunizationEditForm(user);
		await user.click(within(editDialog).getByRole("button", { name: "Save changes" }));

		expect(await within(editDialog).findByRole("alert")).toHaveTextContent(
			"The current dose can’t be more than the total doses.",
		);
	});
});
