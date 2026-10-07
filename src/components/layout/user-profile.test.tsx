import { render, screen } from "@testing-library/react";
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
		signOut: signOutMock,
	},
}));
vi.mock("@/components/layout/settings-dialog", () => ({ SettingsDialog: () => null }));

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
