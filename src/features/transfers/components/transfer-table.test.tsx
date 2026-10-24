import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { TransferDetailsType } from "../types";
import { TransferTable } from "./transfer-table";

const { resendMock, retryMock, cancelMock, router } = vi.hoisted(() => ({
	resendMock: vi.fn(),
	retryMock: vi.fn(),
	cancelMock: vi.fn(),
	router: { refresh: vi.fn(), push: vi.fn() },
}));

vi.mock("next/navigation", () => ({
	useRouter: () => router,
	usePathname: () => "/dashboard/transfers",
	useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: { useActiveMemberRole: () => ({ data: { role: "owner" } }) },
}));
vi.mock("@/features/transfers/server/resend-transfer-request-action", () => ({
	resendTransferRequestAction: resendMock,
}));
vi.mock("@/features/transfers/server/retry-transfer-delivery-action", () => ({
	retryTransferDeliveryAction: retryMock,
}));
vi.mock("@/features/transfers/server/cancel-transfer-action", () => ({
	cancelTransferAction: cancelMock,
}));

const waitingTransfer: TransferDetailsType = {
	id: "TRF-1",
	patientName: "Chuka Joy Eze",
	patientFirstName: "Chuka",
	patientMiddleName: "Joy",
	patientLastName: "Eze",
	patientId: "patient-1",
	status: "pending",
	requestedAt: "2026-10-16T15:07:00.000Z",
	targetHospitalName: "Lagos University Teaching Hospital",
	targetHospitalEmail: "records@luth.example.org",
	requestedByName: "QA Owner Four",
	notes: null,
	patientApprovalStatus: "waiting",
	patientRejectionReason: null,
	deliveryStatus: "not_started",
	approvedAt: null,
	rejectedAt: null,
	sentAt: null,
	failedAt: null,
	cancelledAt: null,
	transferContent: [],
};

const failedTransfer: TransferDetailsType = {
	...waitingTransfer,
	id: "TRF-2",
	patientName: "Ngozi Bello",
	patientId: "patient-2",
	status: "failed",
	patientApprovalStatus: "approved",
	deliveryStatus: "failed",
	approvedAt: "2026-10-16T15:08:00.000Z",
	failedAt: "2026-10-16T15:08:05.000Z",
};

let savedTransfers: Record<string, TransferDetailsType>;

beforeEach(() => {
	resendMock.mockReset();
	retryMock.mockReset();
	cancelMock.mockReset();
	savedTransfers = { "TRF-1": waitingTransfer, "TRF-2": failedTransfer };
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: RequestInfo | URL) => {
			const id = decodeURIComponent(String(input).split("/").pop() ?? "");
			return { ok: true, json: async () => ({ transfer: savedTransfers[id] ?? null }) } as Response;
		}),
	);
});

function renderTransferTable() {
	render(
		<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
			<TransferTable
				data={[waitingTransfer, failedTransfer]}
				page={1}
				limit={14}
				totalPages={1}
				isPending={false}
				onPreviousPage={() => {}}
				onNextPage={() => {}}
				onLimitChange={() => {}}
			/>
		</SWRConfig>,
	);
}

function rowFor(patientName: string) {
	return screen.getByText(patientName).closest("tr") as HTMLElement;
}

async function chooseFromRowMenu(patientName: string, action: string) {
	const user = userEvent.setup();
	await user.click(
		within(rowFor(patientName)).getByRole("button", { name: "Open transfer actions" }),
	);
	await user.click(await screen.findByRole("menuitem", { name: action }));
	return user;
}

async function chooseFromDrawerMenu(patientName: string, action: string) {
	const user = userEvent.setup();
	await user.click(rowFor(patientName));
	const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
	await within(drawer).findByText(patientName);
	await user.click(within(drawer).getByRole("button", { name: "Transfer actions" }));
	await user.click(await screen.findByRole("menuitem", { name: action }));
	return user;
}

describe.each([
	{ entryPoint: "row menu", choose: chooseFromRowMenu },
	{ entryPoint: "drawer menu", choose: chooseFromDrawerMenu },
])("Transfer recovery from the $entryPoint", ({ choose }) => {
	test("resending a waiting request shows where the link went in the transfer's details", async () => {
		resendMock.mockResolvedValue({
			status: "success",
			message: "Approval link sent to chuka@example.com.",
		});
		renderTransferTable();

		await choose("Chuka Joy Eze", "Resend request");

		const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
		expect(await within(drawer).findByRole("status")).toHaveTextContent(
			"Approval link sent to chuka@example.com.",
		);
		expect(within(drawer).getByText("Chuka Joy Eze")).toBeVisible();
		expect(resendMock).toHaveBeenCalledWith("TRF-1");
	});

	test("retrying a failed delivery shows the access code was sent and refreshes the activity", async () => {
		let finishRetry!: () => void;
		retryMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					finishRetry = () => {
						savedTransfers["TRF-2"] = {
							...failedTransfer,
							status: "completed",
							deliveryStatus: "sent",
							failedAt: null,
							sentAt: "2026-10-16T16:00:00.000Z",
						};
						resolve({
							status: "success",
							message: "Access code sent to records@luth.example.org.",
						});
					};
				}),
		);
		renderTransferTable();

		await choose("Ngozi Bello", "Retry transfer");

		const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
		expect(await within(drawer).findByText("The access email could not be sent")).toBeVisible();
		await act(async () => finishRetry());

		expect(await within(drawer).findByRole("status")).toHaveTextContent(
			"Access code sent to records@luth.example.org.",
		);
		expect(
			await within(drawer).findByText("Access code sent to records@luth.example.org"),
		).toBeVisible();
		expect(
			within(drawer).queryByText("The access email could not be sent"),
		).not.toBeInTheDocument();
		expect(retryMock).toHaveBeenCalledWith("TRF-2");
	});

	test("cancelling asks first, then withdraws the request and shows it cancelled", async () => {
		cancelMock.mockImplementation(async () => {
			savedTransfers["TRF-1"] = {
				...waitingTransfer,
				status: "cancelled",
				cancelledAt: "2026-10-16T16:00:00.000Z",
			};
			return {
				status: "success",
				message: "Transfer cancelled. The patient can no longer respond to the request.",
			};
		});
		renderTransferTable();

		const user = await choose("Chuka Joy Eze", "Cancel transfer");
		const dialog = await screen.findByRole("alertdialog", { name: "Cancel transfer?" });
		expect(cancelMock).not.toHaveBeenCalled();
		await user.click(within(dialog).getByRole("button", { name: "Cancel transfer" }));

		const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
		expect(await within(drawer).findByRole("status")).toHaveTextContent(
			"Transfer cancelled. The patient can no longer respond to the request.",
		);
		expect(await within(drawer).findByText("Cancelled before the patient responded")).toBeVisible();
		expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
		expect(cancelMock).toHaveBeenCalledWith("TRF-1");
	});

	test.each([
		{
			action: "Resend request",
			patientName: "Chuka Joy Eze",
			transferId: "TRF-1",
			mock: resendMock,
			error: "We couldn’t send the approval link. Please try again.",
		},
		{
			action: "Retry transfer",
			patientName: "Ngozi Bello",
			transferId: "TRF-2",
			mock: retryMock,
			error: "We couldn’t retry this transfer. Please try again.",
		},
		{
			action: "Cancel transfer",
			patientName: "Chuka Joy Eze",
			transferId: "TRF-1",
			mock: cancelMock,
			error: "We couldn’t cancel this transfer. Please try again.",
		},
	])(
		"shows a plain error in the details when $action never reaches the server",
		async ({ action, patientName, transferId, mock, error }) => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			mock.mockRejectedValue(new Error("Failed to fetch"));
			renderTransferTable();

			const user = await choose(patientName, action);
			if (action === "Cancel transfer") {
				const dialog = await screen.findByRole("alertdialog", { name: "Cancel transfer?" });
				await user.click(within(dialog).getByRole("button", { name: "Cancel transfer" }));
			}

			const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
			expect(await within(drawer).findByRole("alert")).toHaveTextContent(error);
			expect(mock).toHaveBeenCalledWith(transferId);
		},
	);
});

describe("Transfer recovery feedback", () => {
	test("a failed resend shows why and refreshes the transfer, which may have moved on", async () => {
		let finishResend!: () => void;
		resendMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					finishResend = () => {
						savedTransfers["TRF-1"] = {
							...waitingTransfer,
							status: "completed",
							patientApprovalStatus: "approved",
							deliveryStatus: "sent",
							approvedAt: "2026-10-16T15:30:00.000Z",
							sentAt: "2026-10-16T15:30:05.000Z",
						};
						resolve({
							status: "failed",
							error: "Only a transfer still waiting for the patient's answer can be resent.",
						});
					};
				}),
		);
		renderTransferTable();

		await chooseFromRowMenu("Chuka Joy Eze", "Resend request");
		const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
		expect(await within(drawer).findByText("Waiting for patient response")).toBeVisible();
		await act(async () => finishResend());

		expect(await within(drawer).findByRole("alert")).toHaveTextContent(
			"Only a transfer still waiting for the patient's answer can be resent.",
		);
		expect(await within(drawer).findByText("Approved by the patient")).toBeVisible();
	});

	test("while one action is running, the row menus don't offer another", async () => {
		let finishResend!: () => void;
		resendMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					finishResend = () =>
						resolve({ status: "success", message: "Approval link sent to chuka@example.com." });
				}),
		);
		renderTransferTable();

		const user = await chooseFromRowMenu("Chuka Joy Eze", "Resend request");
		await user.click(await screen.findByRole("button", { name: "Close transfer details" }));
		await user.click(
			within(rowFor("Chuka Joy Eze")).getByRole("button", { name: "Open transfer actions" }),
		);
		expect(await screen.findByRole("menuitem", { name: "Resend request" })).toHaveAttribute(
			"aria-disabled",
			"true",
		);
		expect(screen.getByRole("menuitem", { name: "Cancel transfer" })).toHaveAttribute(
			"aria-disabled",
			"true",
		);
		await user.keyboard("{Escape}");

		await act(async () => finishResend());
		await user.click(
			within(rowFor("Ngozi Bello")).getByRole("button", { name: "Open transfer actions" }),
		);
		expect(await screen.findByRole("menuitem", { name: "Retry transfer" })).not.toHaveAttribute(
			"aria-disabled",
		);
		expect(resendMock).toHaveBeenCalledTimes(1);
	});

	test("an action stays pending, with its result hidden, until the transfer's details are refreshed", async () => {
		resendMock.mockResolvedValue({
			status: "success",
			message: "Approval link sent to chuka@example.com.",
		});
		let finishRefresh!: () => void;
		renderTransferTable();
		const user = userEvent.setup();
		await user.click(rowFor("Chuka Joy Eze"));
		const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
		expect(await within(drawer).findByText("Waiting for patient response")).toBeVisible();
		vi.stubGlobal(
			"fetch",
			vi.fn(
				() =>
					new Promise<Response>((resolve) => {
						finishRefresh = () =>
							resolve({ ok: true, json: async () => ({ transfer: waitingTransfer }) } as Response);
					}),
			),
		);
		await user.click(within(drawer).getByRole("button", { name: "Transfer actions" }));
		await user.click(await screen.findByRole("menuitem", { name: "Resend request" }));
		await waitFor(() => expect(finishRefresh).toBeDefined());
		await user.click(within(drawer).getByRole("button", { name: "Transfer actions" }));
		expect(await screen.findByRole("menuitem", { name: "Resend request" })).toHaveAttribute(
			"aria-disabled",
			"true",
		);
		expect(within(drawer).queryByRole("status")).not.toBeInTheDocument();
		await user.keyboard("{Escape}");

		await act(async () => finishRefresh());

		expect(await within(drawer).findByRole("status")).toHaveTextContent(
			"Approval link sent to chuka@example.com.",
		);
	});

	test("a refresh that fails keeps the action's result and says the details weren't refreshed", async () => {
		let finishResend!: () => void;
		resendMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					finishResend = () =>
						resolve({ status: "success", message: "Approval link sent to chuka@example.com." });
				}),
		);
		renderTransferTable();

		await chooseFromRowMenu("Chuka Joy Eze", "Resend request");
		const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
		expect(await within(drawer).findByText("Waiting for patient response")).toBeVisible();
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }) as Response),
		);
		await act(async () => finishResend());

		expect(await within(drawer).findByRole("status")).toHaveTextContent(
			"Approval link sent to chuka@example.com. We couldn’t refresh its details.",
		);
		expect(within(drawer).getByText("Waiting for patient response")).toBeVisible();
	});

	test("cancelling from the row a transfer viewed earlier never shows its old state beside the result", async () => {
		cancelMock.mockResolvedValue({
			status: "success",
			message: "Transfer cancelled. The patient can no longer respond to the request.",
		});
		renderTransferTable();
		const user = userEvent.setup();
		await user.click(rowFor("Chuka Joy Eze"));
		const viewedDrawer = await screen.findByRole("dialog", { name: "Transfer details" });
		expect(await within(viewedDrawer).findByText("Waiting for patient response")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Close transfer details" }));
		let finishRefresh!: () => void;
		vi.stubGlobal(
			"fetch",
			vi.fn(
				() =>
					new Promise<Response>((resolve) => {
						finishRefresh = () =>
							resolve({
								ok: true,
								json: async () => ({
									transfer: {
										...waitingTransfer,
										status: "cancelled",
										cancelledAt: "2026-10-16T16:00:00.000Z",
									},
								}),
							} as Response);
					}),
			),
		);

		await chooseFromRowMenu("Chuka Joy Eze", "Cancel transfer");
		const dialog = await screen.findByRole("alertdialog", { name: "Cancel transfer?" });
		await user.click(within(dialog).getByRole("button", { name: "Cancel transfer" }));
		await waitFor(() => expect(finishRefresh).toBeDefined());

		expect(screen.queryByText("Waiting for patient response")).not.toBeInTheDocument();
		await act(async () => finishRefresh());

		const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
		expect(await within(drawer).findByRole("status")).toHaveTextContent(
			"Transfer cancelled. The patient can no longer respond to the request.",
		);
		expect(within(drawer).getByText("Cancelled before the patient responded")).toBeVisible();
		expect(within(drawer).queryByText("Waiting for patient response")).not.toBeInTheDocument();
	});

	test("an open row menu stays open while the page around the table updates", async () => {
		const table = (onPreviousPage: () => void) => (
			<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
				<TransferTable
					data={[waitingTransfer, failedTransfer]}
					page={1}
					limit={14}
					totalPages={1}
					isPending={false}
					onPreviousPage={onPreviousPage}
					onNextPage={() => {}}
					onLimitChange={() => {}}
				/>
			</SWRConfig>
		);
		const { rerender } = render(table(() => {}));
		const user = userEvent.setup();
		await user.click(
			within(rowFor("Chuka Joy Eze")).getByRole("button", { name: "Open transfer actions" }),
		);
		expect(await screen.findByRole("menuitem", { name: "Resend request" })).toBeVisible();

		rerender(table(() => {}));

		expect(screen.getByRole("menuitem", { name: "Resend request" })).toBeVisible();
	});

	test("a result that arrives after the drawer closes doesn't reappear when the transfer is reopened", async () => {
		let finishResend!: () => void;
		resendMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					finishResend = () =>
						resolve({ status: "success", message: "Approval link sent to chuka@example.com." });
				}),
		);
		renderTransferTable();

		const user = await chooseFromRowMenu("Chuka Joy Eze", "Resend request");
		await user.click(await screen.findByRole("button", { name: "Close transfer details" }));
		await act(async () => finishResend());
		await user.click(rowFor("Chuka Joy Eze"));

		const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
		expect(await within(drawer).findByText("Waiting for patient response")).toBeVisible();
		expect(within(drawer).queryByRole("status")).not.toBeInTheDocument();
		expect(resendMock).toHaveBeenCalledWith("TRF-1");
	});

	test("a retry that finishes after switching transfers shows nothing on the other transfer", async () => {
		let finishRetry!: () => void;
		retryMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					finishRetry = () =>
						resolve({
							status: "success",
							message: "Access code sent to records@luth.example.org.",
						});
				}),
		);
		renderTransferTable();

		const user = await chooseFromRowMenu("Ngozi Bello", "Retry transfer");
		await user.click(await screen.findByRole("button", { name: "Close transfer details" }));
		await user.click(rowFor("Chuka Joy Eze"));
		const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
		expect(await within(drawer).findByText("Chuka Joy Eze")).toBeVisible();
		await user.click(within(drawer).getByRole("button", { name: "Transfer actions" }));
		const resendItem = await screen.findByRole("menuitem", { name: "Resend request" });
		expect(resendItem).toHaveAttribute("aria-disabled", "true");

		await act(async () => finishRetry());

		await waitFor(() => expect(resendItem).not.toHaveAttribute("aria-disabled"));
		await user.keyboard("{Escape}");
		expect(within(drawer).getByText("Chuka Joy Eze")).toBeVisible();
		expect(within(drawer).queryByRole("status")).not.toBeInTheDocument();
		expect(within(drawer).queryByRole("alert")).not.toBeInTheDocument();
	});

	test("a running cancel can't be dismissed, so its result opens the transfer that was cancelled", async () => {
		let finishCancel!: () => void;
		cancelMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					finishCancel = () => {
						savedTransfers["TRF-1"] = {
							...waitingTransfer,
							status: "cancelled",
							cancelledAt: "2026-10-16T16:00:00.000Z",
						};
						resolve({
							status: "success",
							message: "Transfer cancelled. The patient can no longer respond to the request.",
						});
					};
				}),
		);
		renderTransferTable();

		const user = await chooseFromRowMenu("Chuka Joy Eze", "Cancel transfer");
		const dialog = await screen.findByRole("alertdialog", { name: "Cancel transfer?" });
		await user.click(within(dialog).getByRole("button", { name: "Cancel transfer" }));
		await user.keyboard("{Escape}");

		expect(screen.getByRole("alertdialog", { name: "Cancel transfer?" })).toBeVisible();
		expect(within(dialog).getByRole("button", { name: "Cancelling…" })).toBeDisabled();
		expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
		expect(
			within(dialog).getByRole("button", { name: "Close cancel transfer dialog" }),
		).toBeDisabled();

		await act(async () => finishCancel());

		const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
		expect(await within(drawer).findByRole("status")).toHaveTextContent(
			"Transfer cancelled. The patient can no longer respond to the request.",
		);
		expect(within(drawer).getByText("Chuka Joy Eze")).toBeVisible();
		expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
	});
});
