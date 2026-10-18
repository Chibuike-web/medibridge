import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { EncounterCreatedBanner } from "./encounter-created-banner";

const navigation = vi.hoisted(() => ({
	replace: vi.fn(),
	params: "created=true&allergiesQuery=pen&diagnosesStatus=active&vitalsPage=2",
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: navigation.replace }),
	usePathname: () => "/dashboard/patients/patient-1/encounters/ENC-1",
	useSearchParams: () => new URLSearchParams(navigation.params),
}));

test("dismissing the banner removes only the created flag and keeps every table's settings", async () => {
	const user = userEvent.setup();
	render(<EncounterCreatedBanner />);
	expect(screen.getByRole("status")).toHaveTextContent("Encounter created.");

	await user.click(screen.getByRole("button", { name: "Dismiss message" }));

	expect(navigation.replace).toHaveBeenCalledWith(
		"/dashboard/patients/patient-1/encounters/ENC-1?allergiesQuery=pen&diagnosesStatus=active&vitalsPage=2",
		{ scroll: false },
	);
});
