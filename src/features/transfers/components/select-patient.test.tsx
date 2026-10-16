import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SelectPatient } from "./select-patient";

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: refreshMock, replace: vi.fn() }),
}));

function renderPatientPicker() {
	render(
		<SWRConfig
			value={{
				provider: () => new Map(),
				dedupingInterval: 0,
				errorRetryInterval: 20,
				errorRetryCount: 1,
				revalidateOnFocus: false,
				revalidateOnReconnect: false,
			}}
		>
			<SelectPatient
				selectedTransferPatients={[]}
				isRestoringPatients={false}
				onPatientToggle={vi.fn()}
				onPatientRemove={vi.fn()}
				patients={[]}
				page={1}
				limit={20}
				totalPages={1}
			/>
		</SWRConfig>,
	);
}

describe("patient picker access recovery", () => {
	beforeEach(() => refreshMock.mockReset());
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	test.each([401, 403])(
		"refreshes page access checks after HTTP %s and does not retry",
		async (status) => {
			vi.useFakeTimers();
			const fetchMock = vi.fn(async () =>
				Response.json({ status: "failed", error: "Access unavailable." }, { status }),
			);
			vi.stubGlobal("fetch", fetchMock);
			renderPatientPicker();
			expect(screen.getByRole("button", { name: "Select patient" })).toBeVisible();
			await act(async () => {
				await vi.advanceTimersByTimeAsync(10_000);
			});
			expect(refreshMock).toHaveBeenCalledOnce();
			expect(fetchMock).toHaveBeenCalledTimes(1);
		},
	);

	test("retries a temporary server failure and displays the recovered patients without refreshing the page", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				Response.json({ status: "failed", error: "Temporary failure." }, { status: 500 }),
			)
			.mockResolvedValue(
				Response.json({
					patients: [{ patientId: "PAT-001", name: "Ada Okafor" }],
					page: 1,
					totalPages: 1,
				}),
			);
		vi.stubGlobal("fetch", fetchMock);
		const user = userEvent.setup();
		renderPatientPicker();
		await user.click(screen.getByRole("button", { name: "Select patient" }));
		expect(await screen.findByRole("button", { name: /Ada Okafor/ })).toBeVisible();
		expect(refreshMock).not.toHaveBeenCalled();
	});

	test("displays fetched patients without refreshing page access checks", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({
					patients: [{ patientId: "PAT-001", name: "Ada Okafor" }],
					page: 1,
					totalPages: 1,
				}),
			),
		);
		const user = userEvent.setup();
		renderPatientPicker();
		await user.click(screen.getByRole("button", { name: "Select patient" }));
		expect(await screen.findByRole("button", { name: /Ada Okafor/ })).toBeVisible();
		expect(refreshMock).not.toHaveBeenCalled();
	});
});
