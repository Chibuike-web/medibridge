import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { Sidebar } from "./sidebar";

vi.mock("next/navigation", () => ({
	usePathname: () => "/dashboard/patients",
	useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/components/layout/user-profile", () => ({ UserProfile: () => null }));

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
