import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SWRConfig } from "swr";
import { PatientsClient } from "./patients/patients-client";
import { TransfersClient } from "./transfers/transfers-client";
import type { PatientListItemType } from "@/features/patients/types";
import type { TransferType } from "@/features/transfers/types";

// Next's native history integration publishes URL changes to useSearchParams.
vi.mock("next/navigation", async () => {
	const { useSyncExternalStore } = await import("react");
	return {
		usePathname: () => window.location.pathname,
		useSearchParams: () =>
			new URLSearchParams(
				useSyncExternalStore(
					(onChange) => {
						window.addEventListener("popstate", onChange);
						return () => window.removeEventListener("popstate", onChange);
					},
					() => window.location.search,
				),
			),
		useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
	};
});
vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: { useActiveMemberRole: () => ({ data: { role: "owner" } }) },
}));

const patients: PatientListItemType[] = [
	{ patientId: "PAT-1", name: "Ada Obi", gender: "Female", age: 40, createdAt: "2026-10-17" },
	{ patientId: "PAT-2", name: "Chika Eze", gender: "Male", age: 34, createdAt: "2026-10-16" },
];
const transfers: TransferType[] = patients.map((patient, index) => ({
	id: `TRF-${index + 1}`,
	patientId: patient.patientId,
	patientName: patient.name,
	patientFirstName: patient.name.split(" ")[0],
	patientMiddleName: null,
	patientLastName: patient.name.split(" ")[1],
	status: index === 0 ? "pending" : "completed",
	requestedAt: "2026-10-17",
	targetHospitalName: "Mercy Hospital",
	targetHospitalEmail: "mercy@example.com",
}));
const listCases = [
	{
		name: "patients",
		first: "Ada Obi",
		second: "Chika Eze",
		filterQuery: "gender=male",
		filterLabel: "Gender: Male",
		linkName: "Add patient",
		createPath: "/dashboard/add-new-patient",
		render: () => (
			<PatientsClient
				patients={patients}
				page={1}
				limit={14}
				totalPages={2}
				searchQuery=""
				createdFrom=""
				createdTo=""
				genderFilter=""
				ageGroupFilter=""
			/>
		),
		rows: patients,
	},
	{
		name: "transfers",
		first: "Ada Obi",
		second: "Chika Eze",
		filterQuery: "status=completed",
		filterLabel: "Status: Completed",
		linkName: "New transfer request",
		createPath: "/dashboard/new-transfer-request",
		render: () => (
			<TransfersClient
				transfers={transfers}
				page={1}
				limit={14}
				totalPages={2}
				searchQuery=""
				requestedFrom=""
				requestedTo=""
				statusFilters={[]}
			/>
		),
		rows: transfers,
	},
];
afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe.each(listCases)(
	"$name list",
	({
		name,
		first,
		second,
		filterQuery,
		filterLabel,
		linkName,
		createPath,
		render: renderClient,
		rows,
	}) => {
		beforeEach(() => {
			window.history.replaceState(null, "", `/dashboard/${name}`);
			const replaceState = window.history.replaceState.bind(window.history);
			const pushState = window.history.pushState.bind(window.history);
			vi.spyOn(window.history, "replaceState").mockImplementation((...args) => {
				replaceState(...args);
				window.dispatchEvent(new PopStateEvent("popstate"));
			});
			vi.spyOn(window.history, "pushState").mockImplementation((...args) => {
				pushState(...args);
				window.dispatchEvent(new PopStateEvent("popstate"));
			});
			vi.stubGlobal(
				"fetch",
				vi.fn(async (input: RequestInfo | URL) => {
					const params = new URL(String(input), "http://localhost").searchParams;
					const filtered =
						(params.has("gender") && params.get("gender") !== "") ||
						(params.has("status") && params.get("status") !== "");
					const matchingRows =
						params.get("query") || params.get("page") === "2" || filtered ? [rows[1]] : [rows[0]];
					return Response.json({
						status: "success",
						[name]: matchingRows,
						page: Number(params.get("page")),
						limit: 14,
						totalPages: 2,
					});
				}),
			);
		});

		test("searches and paginates using the current URL, and preserves it in the creation link", async () => {
			const user = userEvent.setup();
			render(
				<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
					{renderClient()}
				</SWRConfig>,
			);
			await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toBeEnabled());
			expect(within(screen.getByRole("table")).getByText(first)).toBeVisible();
			await user.click(screen.getByRole("button", { name: "Next" }));
			await waitFor(() =>
				expect(within(screen.getByRole("table")).getByText(second)).toBeVisible(),
			);
			expect(window.location.search).toBe("?page=2");
			await user.type(screen.getByRole("searchbox"), "Chika");
			await waitFor(() =>
				expect(new URLSearchParams(window.location.search).get("query")).toBe("Chika"),
			);
			expect(new URLSearchParams(window.location.search).get("page")).toBe("1");
			await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toBeEnabled());
			const returnTo = `/dashboard/${name}${window.location.search}`;
			expect(screen.getByRole("link", { name: linkName })).toHaveAttribute(
				"href",
				`${createPath}?returnTo=${encodeURIComponent(returnTo)}`,
			);
			expect(within(screen.getByRole("table")).queryByText(first)).not.toBeInTheDocument();
		});

		test("follows filter and back/forward URL changes while mounted without copying stale server rows", async () => {
			render(
				<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
					{renderClient()}
				</SWRConfig>,
			);
			await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toBeEnabled());
			expect(within(screen.getByRole("table")).getByText(first)).toBeVisible();
			await act(async () =>
				window.history.replaceState(null, "", `/dashboard/${name}?${filterQuery}`),
			);
			await waitFor(() => expect(screen.getByText(filterLabel)).toBeVisible());
			await waitFor(() => {
				expect(within(screen.getByRole("table")).getByText(second)).toBeVisible();
				expect(within(screen.getByRole("table")).queryByText(first)).not.toBeInTheDocument();
			});
			await act(async () => {
				window.history.replaceState(null, "", `/dashboard/${name}?query=Chika&page=2`);
			});
			expect(screen.getByRole("searchbox")).toHaveValue("Chika");
			await waitFor(() => expect(screen.getByText("Page 2 of 2")).toBeVisible());
			await act(async () => window.history.replaceState(null, "", `/dashboard/${name}`));
			expect(screen.getByRole("searchbox")).toHaveValue("");
			await waitFor(() => expect(within(screen.getByRole("table")).getByText(first)).toBeVisible());
		});

		test("restores the rows when navigating Back and Forward between pages", async () => {
			const user = userEvent.setup();
			render(
				<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
					{renderClient()}
				</SWRConfig>,
			);
			await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toBeEnabled());
			expect(within(screen.getByRole("table")).getByText(first)).toBeVisible();
			await user.click(screen.getByRole("button", { name: "Next" }));
			await waitFor(() =>
				expect(within(screen.getByRole("table")).getByText(second)).toBeVisible(),
			);
			await act(async () => window.history.back());
			await waitFor(() => {
				expect(window.location.search).toBe("");
				expect(within(screen.getByRole("table")).getByText(first)).toBeVisible();
			});
			await act(async () => window.history.forward());
			await waitFor(() => {
				expect(window.location.search).toBe("?page=2");
				expect(within(screen.getByRole("table")).getByText(second)).toBeVisible();
			});
		});

		test("removes a filter and reloads the unfiltered rows", async () => {
			window.history.replaceState(null, "", `/dashboard/${name}?${filterQuery}`);
			const user = userEvent.setup();
			render(
				<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
					{renderClient()}
				</SWRConfig>,
			);
			await waitFor(() =>
				expect(within(screen.getByRole("table")).getByText(second)).toBeVisible(),
			);
			await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toBeEnabled());
			await user.click(screen.getByRole("button", { name: `Remove ${filterLabel} filter` }));
			await waitFor(() => expect(within(screen.getByRole("table")).getByText(first)).toBeVisible());
			expect(screen.queryByText(filterLabel)).not.toBeInTheDocument();
			expect(new URLSearchParams(window.location.search).get("page")).toBe("1");
		});
	},
);
