import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { Sidebar } from "./sidebar";

vi.mock("next/navigation", () => ({
	usePathname: () => "/dashboard/patients",
	useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/components/layout/user-profile", () => ({ UserProfile: () => null }));
vi.mock("@/components/layout/mobile-menu", () => ({ MobileMenu: () => null }));

function setTabletWidth(isTabletWidth: boolean) {
	vi.stubGlobal("matchMedia", () => ({
		matches: isTabletWidth,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	}));
}

beforeEach(() => {
	setTabletWidth(false);
});

test("names the signed-in hospital, and shows its initials once collapsed", async () => {
	const user = userEvent.setup();
	render(<Sidebar hospitalName="Medicare Hospital" />);

	expect(screen.getByRole("heading", { name: "Medicare Hospital" })).toHaveTextContent(
		"Medicare Hospital",
	);
	expect(screen.queryByRole("heading", { name: "Medibridge" })).not.toBeInTheDocument();

	await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));

	expect(screen.getByRole("heading", { name: "Medicare Hospital" })).toHaveTextContent("MH");
	expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
});

test("keeps the sidebar collapsed to its icons at tablet width, even when saved expanded", () => {
	setTabletWidth(true);
	render(<Sidebar hospitalName="Medicare Hospital" initialWidth="272" />);

	expect(screen.getByRole("heading", { name: "Medicare Hospital" })).toHaveTextContent("MH");
	expect(
		within(screen.getByRole("complementary")).getByRole("link", { name: "Patients" }),
	).toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Collapse sidebar" })).not.toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Expand sidebar" })).not.toBeInTheDocument();
});

test("opens the same search from the phone top bar", async () => {
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	const user = userEvent.setup();
	render(<Sidebar hospitalName="Medicare Hospital" />);

	await user.click(screen.getByRole("button", { name: "Search" }));

	expect(await screen.findByRole("dialog")).toBeVisible();
});
