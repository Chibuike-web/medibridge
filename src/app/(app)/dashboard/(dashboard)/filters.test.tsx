import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense, use, useState, type ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { PatientsClient } from "./patients/patients-client";
import { TransfersClient } from "./transfers/transfers-client";

const navigation = vi.hoisted(() => ({
	pathname: "",
	params: "page=2&query=Ada",
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
	authClient: { useActiveMemberRole: () => ({ data: { role: "owner" } }) },
}));
vi.mock("@/features/transfers/server/cancel-transfer-action", () => ({
	cancelTransferAction: vi.fn(),
}));
vi.mock("@/features/transfers/server/resend-transfer-request-action", () => ({
	resendTransferRequestAction: vi.fn(),
}));
vi.mock("@/features/transfers/server/retry-transfer-delivery-action", () => ({
	retryTransferDeliveryAction: vi.fn(),
}));

const filterCases = [
	{
		name: "transfer status",
		pathname: "/dashboard/transfers",
		submenu: "Status",
		role: "checkbox" as const,
		firstOption: "Pending",
		secondOption: "Rejected",
		parameter: "status",
		expectedValue: "pending,rejected",
		renderClient: () => (
			<TransfersClient
				transfers={[]}
				page={2}
				limit={14}
				totalPages={3}
				searchQuery="Ada"
				requestedFrom=""
				requestedTo=""
				statusFilters={[]}
			/>
		),
	},
	{
		name: "patient gender",
		pathname: "/dashboard/patients",
		submenu: "Gender",
		role: "radio" as const,
		firstOption: "Male",
		secondOption: "Female",
		parameter: "gender",
		expectedValue: "female",
		renderClient: () => (
			<PatientsClient
				patients={[]}
				page={2}
				limit={14}
				totalPages={3}
				searchQuery="Ada"
				createdFrom=""
				createdTo=""
				genderFilter=""
				ageGroupFilter=""
			/>
		),
	},
];

beforeEach(() => {
	navigation.params = "page=2&query=Ada";
	navigation.push.mockReset();
	navigation.replace.mockReset();
});

describe.each(filterCases)("$name filters", (scenario) => {
	test("accepts further choices while the filtered table is still loading", async () => {
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
		navigation.pathname = scenario.pathname;
		const user = userEvent.setup();
		render(
			<Suspense fallback="Loading route">
				<RouterHarness>{scenario.renderClient()}</RouterHarness>
			</Suspense>,
		);
		const table = screen.getByRole("table");
		await user.click(screen.getByRole("button", { name: "Filter" }));
		await user.click(screen.getByRole("menuitem", { name: scenario.submenu }));
		const firstOption = await screen.findByRole(scenario.role, { name: scenario.firstOption });
		const secondOption = screen.getByRole(scenario.role, { name: scenario.secondOption });
		expect(firstOption).not.toBeChecked();
		expect(secondOption).not.toBeChecked();

		try {
			await user.pointer({ keys: "[TouchA]", target: firstOption });
			expect(table).toHaveAttribute("aria-busy", "true");
			expect(firstOption).toBeChecked();
			expect(secondOption).not.toBeChecked();
			expect(firstOption).toBeEnabled();
			expect(secondOption).toBeEnabled();

			await user.pointer({ keys: "[TouchA]", target: secondOption });
			expect(secondOption).toBeChecked();
			if (scenario.role === "checkbox") expect(firstOption).toBeChecked();
			else expect(firstOption).not.toBeChecked();

			const params = new URL(navigation.push.mock.lastCall![0], "http://localhost").searchParams;
			expect(params.get(scenario.parameter)).toBe(scenario.expectedValue);
			expect(params.get("page")).toBeNull();
			expect(params.get("query")).toBe("Ada");
		} finally {
			await act(async () => {
				finishNavigation();
				await route;
			});
		}
	});
});
