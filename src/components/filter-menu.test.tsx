import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RiCheckboxCircleLine } from "@remixicon/react";
import { beforeEach, expect, test, vi } from "vitest";
import { FilterGroup, FilterPopover } from "./filter-menu";

let isPhoneWidth = true;
let widthChangeListeners: (() => void)[] = [];

function setPhoneWidth(isPhone: boolean) {
	act(() => {
		isPhoneWidth = isPhone;
		for (const listener of widthChangeListeners) listener();
	});
}

beforeEach(() => {
	isPhoneWidth = true;
	widthChangeListeners = [];
	vi.stubGlobal("matchMedia", () => ({
		matches: isPhoneWidth,
		addEventListener: (_event: string, listener: () => void) => widthChangeListeners.push(listener),
		removeEventListener: vi.fn(),
	}));
});

test("stays closed after the screen widens and shrinks back to phone width", async () => {
	const user = userEvent.setup();
	render(
		<FilterGroup activeFilterCount={0}>
			<FilterPopover label="Status" icon={RiCheckboxCircleLine}>
				<p>Status options</p>
			</FilterPopover>
		</FilterGroup>,
	);
	await user.click(screen.getByRole("button", { name: "Filters" }));
	expect(await screen.findByRole("dialog", { name: "Filters" })).toBeVisible();

	setPhoneWidth(false);
	expect(screen.getByRole("button", { name: "Status" })).toBeVisible();

	setPhoneWidth(true);

	expect(screen.getByRole("button", { name: "Filters" })).toBeVisible();
	await vi.waitFor(() =>
		expect(screen.queryByRole("dialog", { name: "Filters" })).not.toBeInTheDocument(),
	);
});
