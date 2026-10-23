import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense, use, useState, type ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { TableUrlNavigation } from "@/features/patients/components/table-url-navigation";
import { SharedAllergiesTable, type SharedAllergyRow } from "./allergies-table";

const navigation = vi.hoisted(() => ({
	params: "section=allergies",
	push: vi.fn(),
	replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
	useRouter: () => navigation,
	usePathname: () => "/shared-records/access-1",
	useSearchParams: () => new URLSearchParams(navigation.params),
}));

const penicillin: SharedAllergyRow = {
	allergen: "Penicillin",
	allergyId: "AL-1",
	reaction: "Rash",
	createdAt: "Sep 1, 2026",
	createdAtValue: "2026-09-01",
	severity: "Mild",
	status: "Inactive",
};
const tableProps = {
	page: 1,
	limit: 14,
	totalPages: 1,
	searchQuery: "",
	statusFilters: [],
	severityFilters: [],
	createdFrom: "",
	createdTo: "",
};

beforeEach(() => {
	navigation.params = "section=allergies";
	navigation.push.mockReset();
	navigation.replace.mockReset();
});

test("shared records display and sort every supplied allergy without hiding later records", async () => {
	const user = userEvent.setup();
	const rows: SharedAllergyRow[] = Array.from({ length: 14 }, (_, index) => ({
		...penicillin,
		allergen: `Allergen ${String(index + 1).padStart(2, "0")}`,
		allergyId: `AL-${index + 1}`,
		status: "Active",
	}));
	render(<SharedAllergiesTable {...tableProps} rows={rows} />, { wrapper: TableUrlNavigation });
	const table = screen.getByRole("table");
	const displayedAllergens = () =>
		within(table)
			.getAllByRole("cell", { name: /^Allergen \d+$/ })
			.map((cell) => cell.textContent);
	for (const allergy of rows) {
		expect(within(table).getByText(allergy.allergen)).toBeVisible();
	}
	expect(screen.getByRole("columnheader", { name: "Allergen" })).toHaveAttribute(
		"aria-sort",
		"ascending",
	);
	await user.click(screen.getByRole("columnheader", { name: "Allergen" }));
	expect(displayedAllergens()).toEqual(rows.map((allergy) => allergy.allergen).reverse());
});

test("shows the filter pill and first page while the filtered rows are still loading", async () => {
	let finishNavigation!: () => void;
	const route = new Promise<void>((resolve) => {
		finishNavigation = resolve;
	});
	function PendingRoute() {
		use(route);
		return null;
	}
	function RouterHarness({ children }: { children: ReactNode }) {
		const [isNavigating, setIsNavigating] = useState(false);
		navigation.push.mockImplementation(() => setIsNavigating(true));
		return (
			<>
				{children}
				{isNavigating && <PendingRoute />}
			</>
		);
	}
	const user = userEvent.setup();
	navigation.params += "&allergiesPage=2";
	render(
		<Suspense fallback="Loading route">
			<RouterHarness>
				<TableUrlNavigation>
					<SharedAllergiesTable {...tableProps} page={2} totalPages={4} rows={[penicillin]} />
				</TableUrlNavigation>
			</RouterHarness>
		</Suspense>,
	);
	expect(screen.queryByText("Status: Inactive")).not.toBeInTheDocument();

	await user.click(screen.getByRole("button", { name: "Filter" }));
	await user.click(screen.getByRole("menuitem", { name: "Status" }));
	await user.pointer({
		keys: "[TouchA]",
		target: await screen.findByRole("checkbox", { name: "Inactive" }),
	});
	await user.keyboard("{Escape}{Escape}");

	expect(screen.getByText("Status: Inactive")).toBeVisible();
	expect(screen.getByText("Page 1 of 4")).toBeVisible();
	expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
	expect(within(screen.getByRole("table")).getByText("Penicillin")).toBeVisible();
	const params = new URL(navigation.push.mock.calls[0][0], "http://localhost").searchParams;
	expect(params.get("allergiesStatus")).toBe("Inactive");
	expect(params.get("allergiesPage")).toBeNull();
	expect(params.get("section")).toBe("allergies");
	await act(async () => {
		finishNavigation();
		await route;
	});
});

test("Clear all drops every filter from the URL and the pills once the server responds", async () => {
	const user = userEvent.setup();
	navigation.params += "&allergiesStatus=Inactive&allergiesSeverity=Mild&allergiesQuery=pen";
	const filteredProps = {
		...tableProps,
		searchQuery: "pen",
		rows: [penicillin],
	};
	const { rerender } = render(
		<SharedAllergiesTable
			{...filteredProps}
			statusFilters={["Inactive"]}
			severityFilters={["Mild"]}
		/>,
		{ wrapper: TableUrlNavigation },
	);
	expect(screen.getByText("Status: Inactive")).toBeVisible();
	expect(screen.getByText("Severity: Mild")).toBeVisible();

	await user.click(screen.getByRole("button", { name: "Clear all" }));

	const params = new URL(navigation.push.mock.calls[0][0], "http://localhost").searchParams;
	expect(params.get("allergiesStatus")).toBeNull();
	expect(params.get("allergiesSeverity")).toBeNull();
	expect(params.get("allergiesQuery")).toBe("pen");
	rerender(<SharedAllergiesTable {...filteredProps} />);
	expect(screen.queryByText("Status: Inactive")).not.toBeInTheDocument();
	expect(screen.queryByText("Severity: Mild")).not.toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
});
