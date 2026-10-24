import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { TransferDetailsType } from "../types";
import { TransferTable } from "./transfer-table";

const { resendMock, retryMock, cancelMock } = vi.hoisted(() => ({
	resendMock: vi.fn(),
	retryMock: vi.fn(),
	cancelMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
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

async function confirmCancel(user: ReturnType<typeof userEvent.setup>) {
	const dialog = await screen.findByRole("alertdialog", { name: "Cancel transfer?" });
	await user.click(within(dialog).getByRole("button", { name: "Cancel transfer" }));
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

	test("retrying a failed delivery shows the access code was sent and the refreshed activity", async () => {
		retryMock.mockImplementation(async () => {
			savedTransfers["TRF-2"] = {
				...failedTransfer,
				status: "completed",
				deliveryStatus: "sent",
				failedAt: null,
				sentAt: "2026-10-16T16:00:00.000Z",
			};
			return { status: "success", message: "Access code sent to records@luth.example.org." };
		});
		renderTransferTable();

		await choose("Ngozi Bello", "Retry transfer");

		const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
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
		await screen.findByRole("alertdialog", { name: "Cancel transfer?" });
		expect(cancelMock).not.toHaveBeenCalled();
		await confirmCancel(user);

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
			if (action === "Cancel transfer") await confirmCancel(user);

			const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
			expect(await within(drawer).findByRole("alert")).toHaveTextContent(error);
			expect(mock).toHaveBeenCalledWith(transferId);
		},
	);
});

describe("Transfer recovery feedback", () => {
	test("shows why a resend failed", async () => {
		resendMock.mockResolvedValue({
			status: "failed",
			error: "Add an email address for this patient before resending the request.",
		});
		renderTransferTable();

		await chooseFromRowMenu("Chuka Joy Eze", "Resend request");

		const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
		expect(await within(drawer).findByRole("alert")).toHaveTextContent(
			"Add an email address for this patient before resending the request.",
		);
	});

	test("a retry that finishes after switching transfers shows nothing on the other transfer", async () => {
		let finishRetry!: (result: { status: "success"; message: string }) => void;
		retryMock.mockReturnValue(new Promise((resolve) => (finishRetry = resolve)));
		renderTransferTable();

		const user = await chooseFromRowMenu("Ngozi Bello", "Retry transfer");
		await user.click(await screen.findByRole("button", { name: "Close transfer details" }));
		await user.click(rowFor("Chuka Joy Eze"));
		const drawer = await screen.findByRole("dialog", { name: "Transfer details" });
		expect(await within(drawer).findByText("Chuka Joy Eze")).toBeVisible();

		finishRetry({ status: "success", message: "Access code sent to records@luth.example.org." });
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(within(drawer).queryByRole("status")).not.toBeInTheDocument();
		expect(within(drawer).queryByRole("alert")).not.toBeInTheDocument();
	});
});
