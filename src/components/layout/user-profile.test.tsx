import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { UserProfile } from "./user-profile";

const { signOutMock, replaceMock, refreshMock } = vi.hoisted(() => ({
	signOutMock: vi.fn(),
	replaceMock: vi.fn(),
	refreshMock: vi.fn(),
}));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
}));
vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useSession: () => ({
			data: { user: { name: "Sarah Thompson", email: "sarah@stmary.org", image: null } },
			isPending: false,
		}),
		useActiveMemberRole: () => ({ data: { role: "admin" } }),
		signOut: signOutMock,
	},
}));
vi.mock("@/components/layout/settings-dialog", () => ({ SettingsDialog: () => null }));

describe("profile menu", () => {
	test("shows the signed-in email with the member's role", async () => {
		const user = userEvent.setup();
		render(<UserProfile isCollapsed={false} />);
		await user.click(screen.getByRole("button", { name: /Sarah Thompson/ }));

		const menu = await screen.findByRole("menu");
		expect(within(menu).getByText("sarah@stmary.org")).toBeVisible();
		expect(within(menu).getByText("admin")).toBeVisible();
	});

	test("marks the chosen theme, starting from System like the Settings dialog", async () => {
		const user = userEvent.setup();
		render(<UserProfile isCollapsed={false} />);
		await user.click(screen.getByRole("button", { name: /Sarah Thompson/ }));
		await user.click(await screen.findByRole("menuitem", { name: "Theme" }));

		const system = await screen.findByRole("menuitem", { name: /System/ });
		expect(within(system).getByLabelText("Selected")).toBeInTheDocument();
		expect(
			within(screen.getByRole("menuitem", { name: /Dark/ })).queryByLabelText("Selected"),
		).toBeNull();

		const dark = screen.getByRole("menuitem", { name: /Dark/ });
		dark.focus();
		await user.keyboard("{Enter}");

		expect(within(dark).getByLabelText("Selected")).toBeInTheDocument();
		expect(
			within(screen.getByRole("menuitem", { name: /System/ })).queryByLabelText("Selected"),
		).toBeNull();
	});
});

describe("profile sign-out", () => {
	beforeEach(() => {
		signOutMock.mockResolvedValue({ error: null });
	});

	test("opens sign-in after ending the session", async () => {
		const user = userEvent.setup();
		render(<UserProfile isCollapsed={false} />);
		await user.click(screen.getByRole("button", { name: /Sarah Thompson/ }));
		await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

		await vi.waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/sign-in"));
		expect(refreshMock).toHaveBeenCalled();
	});

	test("keeps the user on the current page when the session could not be ended", async () => {
		const user = userEvent.setup();
		signOutMock.mockResolvedValue({ error: { message: "Could not delete session" } });
		render(<UserProfile isCollapsed={false} />);
		await user.click(screen.getByRole("button", { name: /Sarah Thompson/ }));
		await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Unable to sign out. Please try again.",
		);
		expect(replaceMock).not.toHaveBeenCalled();
		expect(refreshMock).not.toHaveBeenCalled();
	});
});
