import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense, use, useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { PatientsClient } from "./patients/patients-client";
import { TransfersClient } from "./transfers/transfers-client";
import type { PatientListItemType } from "@/features/patients/types";
import type { TransferType } from "@/features/transfers/types";

const navigation = vi.hoisted(() => ({
	pathname: "/dashboard/patients",
	params: "",
	push: vi.fn(),
	replace: vi.fn(),
	refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
	useRouter: () => navigation,
	usePathname: () => navigation.pathname,
	useSearchParams: () => new URLSearchParams(navigation.params),
}));
vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useActiveMemberRole: () => ({ data: { role: "owner" } }),
	},
}));
vi.mock("@/lib/better-auth/auth", () => ({ auth: {}, db: {} }));

const patient: PatientListItemType = {
	name: "Ada Okafor",
	patientId: "PAT-1",
	age: 35,
	gender: "Female",
	createdAt: "2026-10-17",
};
const transfer: TransferType = {
	id: "TRF-1",
	patientName: "Ada Okafor",
	patientId: "PAT-1",
	patientFirstName: "Ada",
	patientMiddleName: null,
	patientLastName: "Okafor",
	status: "pending",
	requestedAt: "2026-10-17",
	targetHospitalName: "Receiving Hospital",
	targetHospitalEmail: "records@receiving.org",
};
const commonProps = { page: 2, limit: 14, totalPages: 4, searchQuery: "Ada" };
const patientProps = {
	...commonProps,
	patients: [patient],
	createdFrom: "2026-10-01",
	createdTo: "",
	genderFilter: "female" as const,
	ageGroupFilter: "" as const,
};
const transferProps = {
	...commonProps,
	transfers: [transfer],
	requestedFrom: "2026-10-01",
	requestedTo: "",
	statusFilters: ["pending" as const],
};
const listCases = [
	{
		name: "patients",
		initialParams: "page=2&limit=14&query=Ada&gender=female&createdFrom=2026-10-01",
		getCreateHref: async (user: ReturnType<typeof userEvent.setup>) => {
			await user.click(screen.getByRole("button", { name: "Add patient" }));
			await user.click(screen.getByRole("radio", { name: /Enter manually/ }));
			await user.click(screen.getByRole("button", { name: "Continue" }));
			return navigation.push.mock.calls[0][0] as string;
		},
		filterName: "gender",
		filterValue: "female",
		renderList: (name = "Ada Okafor", query = "Ada") => (
			<PatientsClient {...patientProps} searchQuery={query} patients={[{ ...patient, name }]} />
		),
	},
	{
		name: "transfers",
		initialParams: "page=2&limit=14&query=Ada&status=pending&requestedFrom=2026-10-01",
		getCreateHref: async () =>
			screen.getByRole("link", { name: "New transfer request" }).getAttribute("href")!,
		filterName: "status",
		filterValue: "pending",
		renderList: (name = "Ada Okafor", query = "Ada") => (
			<TransfersClient
				{...transferProps}
				searchQuery={query}
				transfers={[
					{
						...transfer,
						patientName: name,
						patientFirstName: name.split(" ")[0],
						patientLastName: name.split(" ")[1],
					},
				]}
			/>
		),
	},
];

beforeEach(() => {
	navigation.push.mockReset();
	navigation.replace.mockReset();
	navigation.refresh.mockReset();
});
afterEach(() => {
	vi.useRealTimers();
});

describe.each(listCases)(
	"URL-driven $name list",
	({ name, initialParams, getCreateHref, filterName, filterValue, renderList }) => {
		beforeEach(() => {
			navigation.pathname = `/dashboard/${name}`;
			navigation.params = initialParams;
		});

		test("renders fresh server rows and preserves all URL parameters in the create return link", async () => {
			const user = userEvent.setup();
			const { rerender } = render(renderList());
			expect(within(screen.getByRole("table")).getByText("Ada Okafor")).toBeVisible();
			rerender(renderList("Nneka Obi"));
			expect(within(screen.getByRole("table")).getByText("Nneka Obi")).toBeVisible();
			expect(within(screen.getByRole("table")).queryByText("Ada Okafor")).not.toBeInTheDocument();
			expect(navigation.push).not.toHaveBeenCalled();
			expect(navigation.replace).not.toHaveBeenCalled();
			const href = await getCreateHref(user);
			const returnTo = new URL(href, "http://localhost").searchParams.get("returnTo");
			expect(returnTo).toBe(`${navigation.pathname}?${initialParams}`);
		});

		test("pushes the next page while retaining the active query and filters", async () => {
			const user = userEvent.setup();
			render(renderList());
			await user.click(screen.getByRole("button", { name: "Next" }));
			const [href, options] = navigation.push.mock.calls[0];
			const params = new URL(href, "http://localhost").searchParams;
			expect(params.get("page")).toBe("3");
			expect(params.get("query")).toBe("Ada");
			expect(params.get(filterName)).toBe(filterValue);
			expect(options).toEqual({ scroll: false });
			expect(navigation.replace).not.toHaveBeenCalled();
			expect(within(screen.getByRole("table")).getByText("Ada Okafor")).toBeVisible();
		});

		test("restores the original query when a pending search is cleared", async () => {
			vi.useFakeTimers();
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
				navigation.replace.mockImplementation(() => setIsNavigating(true));
				return (
					<>
						{children}
						{isNavigating && <PendingRoute />}
					</>
				);
			}
			render(
				<Suspense fallback="Loading route">
					<RouterHarness>{renderList()}</RouterHarness>
				</Suspense>,
			);
			const input = screen.getByRole("searchbox");
			fireEvent.change(input, { target: { value: "Nneka" } });
			await act(async () => {
				vi.advanceTimersByTime(300);
			});
			expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
			fireEvent.change(input, { target: { value: "Ada" } });
			await act(async () => {
				vi.advanceTimersByTime(300);
			});
			expect(input).toHaveValue("Ada");
			const href = navigation.replace.mock.calls.at(-1)![0];
			await act(async () => {
				finishNavigation();
				await route;
			});
			expect(new URL(href, "http://localhost").searchParams.get("query")).toBe("Ada");
		});

		test("replaces the URL after a search pause and restores the input on a URL change", async () => {
			vi.useFakeTimers();
			const { rerender } = render(renderList());
			const input = screen.getByRole("searchbox");
			fireEvent.change(input, { target: { value: "Nneka" } });
			expect(input).toHaveValue("Nneka");
			expect(navigation.replace).not.toHaveBeenCalled();
			await act(() => vi.advanceTimersByTime(300));
			const [href, options] = navigation.replace.mock.calls[0];
			const params = new URL(href, "http://localhost").searchParams;
			expect(params.get("page")).toBeNull();
			expect(params.get("query")).toBe("Nneka");
			expect(params.get(filterName)).toBe(filterValue);
			expect(options).toEqual({ scroll: false });
			expect(navigation.push).not.toHaveBeenCalled();
			rerender(renderList("Nneka Obi", "Nneka"));
			rerender(renderList("Ada Okafor", "Ada"));
			expect(input).toHaveValue("Ada");
			rerender(renderList("Nneka Obi", "Nneka"));
			expect(input).toHaveValue("Nneka");
			fireEvent.change(input, { target: { value: "unfinished draft" } });
			rerender(renderList("Ada Okafor", "Restored"));
			expect(input).toHaveValue("Restored");
			await act(async () => {
				vi.advanceTimersByTime(300);
			});
			expect(navigation.replace).toHaveBeenCalledTimes(1);
		});

		test("keeps a space typed between words after the search runs", async () => {
			vi.useFakeTimers();
			const { rerender } = render(renderList());
			const input = screen.getByRole("searchbox");
			fireEvent.change(input, { target: { value: "Ada " } });
			await act(() => vi.advanceTimersByTime(300));
			const urlQuery = new URL(
				navigation.replace.mock.calls[0][0],
				"http://localhost",
			).searchParams.get("query");
			expect(urlQuery).toBe("Ada ");
			rerender(renderList("Ada Okafor", urlQuery ?? ""));
			expect(input).toHaveValue("Ada ");
			fireEvent.change(input, { target: { value: "Ada Okafor" } });
			expect(input).toHaveValue("Ada Okafor");
		});
	},
);
