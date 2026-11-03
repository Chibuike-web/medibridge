import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RiFileList3Fill, RiFileList3Line, RiFunctionFill, RiFunctionLine } from "@remixicon/react";
import { beforeEach, expect, test, vi } from "vitest";
import { MobileMenu } from "./mobile-menu";
import type { Menu } from "./sidebar";

const { signOutMock, replaceMock, refreshMock } = vi.hoisted(() => ({
	signOutMock: vi.fn(),
	replaceMock: vi.fn(),
	refreshMock: vi.fn(),
}));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
	usePathname: () => "/dashboard/patients",
}));
vi.mock("@/lib/better-auth/auth.client", () => ({
	authClient: {
		useSession: () => ({
			data: { user: { name: "Sarah Thompson", email: "sarah@stmary.org", image: null } },
		}),
		useActiveMemberRole: () => ({ data: { role: "owner" } }),
		signOut: signOutMock,
	},
}));
vi.mock("@/components/layout/settings-dialog", () => ({ SettingsDialog: () => null }));

const menus: Menu[] = [
	{
		id: "overview",
		label: "Overview",
		href: "/dashboard/overview",
		icon: RiFunctionLine,
		activeIcon: RiFunctionFill,
	},
	{
		id: "patients",
		label: "Patients",
		href: "/dashboard/patients",
		icon: RiFileList3Line,
		activeIcon: RiFileList3Fill,
	},
];

beforeEach(() => {
	signOutMock.mockResolvedValue({ error: null });
	vi.stubGlobal("matchMedia", () => ({
		matches: false,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	}));
});

test("shows the signed-in name, email and the member's role", async () => {
	const user = userEvent.setup();
	render(<MobileMenu menus={menus} />);
	await user.click(screen.getByRole("button", { name: "Open menu" }));

	const menu = await screen.findByRole("dialog", { name: "Menu" });
	expect(within(menu).getByText("Sarah Thompson")).toBeVisible();
	expect(within(menu).getByText("sarah@stmary.org")).toBeVisible();
	expect(within(menu).getByText("owner")).toBeVisible();
	expect(within(menu).getByRole("button", { name: "Settings" })).toBeVisible();
});

test("lists the main pages, marks the current one, and closes after a page is picked", async () => {
	const user = userEvent.setup();
	render(<MobileMenu menus={menus} />);
	await user.click(screen.getByRole("button", { name: "Open menu" }));

	const navigation = within(await screen.findByRole("dialog", { name: "Menu" })).getByRole(
		"navigation",
		{ name: "Primary" },
	);
	const patientsLink = within(navigation).getByRole("link", { name: "Patients" });
	const overviewLink = within(navigation).getByRole("link", { name: "Overview" });
	expect(patientsLink).toHaveAttribute("aria-current", "page");
	expect(overviewLink).not.toHaveAttribute("aria-current");
	expect(overviewLink).toHaveAttribute("href", "/dashboard/overview");

	await user.click(overviewLink);

	await vi.waitFor(() =>
		expect(screen.queryByRole("dialog", { name: "Menu" })).not.toBeInTheDocument(),
	);
});

test("opens sign-in after ending the session", async () => {
	const user = userEvent.setup();
	render(<MobileMenu menus={menus} />);
	await user.click(screen.getByRole("button", { name: "Open menu" }));
	await user.click(await screen.findByRole("button", { name: "Sign out" }));

	await vi.waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/sign-in"));
	expect(refreshMock).toHaveBeenCalled();
});

test("keeps the user signed in and explains when the session could not be ended", async () => {
	const user = userEvent.setup();
	signOutMock.mockResolvedValue({ error: { message: "Could not delete session" } });
	render(<MobileMenu menus={menus} />);
	await user.click(screen.getByRole("button", { name: "Open menu" }));
	await user.click(await screen.findByRole("button", { name: "Sign out" }));

	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Unable to sign out. Please try again.",
	);
	expect(replaceMock).not.toHaveBeenCalled();
});
