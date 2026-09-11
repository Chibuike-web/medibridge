import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { BillingHistoryCard } from "./billing-history-card";

const billingHistoryCardProps = {
	amount: "₦2,100",
	date: "Aug 31, 2026",
	cardBrand: "visa" as const,
	cardLastFour: "4242",
	expires: "08/28",
	status: "Paid" as const,
	breakdown: {
		billingPeriod: "Aug 1–31, 2026",
		includedCases: "1,000",
		billableOverage: "84",
		ratePerAdditionalCase: "₦25",
		total: "₦2,100",
	},
};

describe("BillingHistoryCard", () => {
	test("expands and collapses its billing details", async () => {
		const user = userEvent.setup();
		render(<BillingHistoryCard {...billingHistoryCardProps} />);

		const summaryButton = screen.getByRole("button", { name: /view more/i });
		expect(summaryButton).toHaveAttribute("aria-expanded", "false");
		expect(screen.queryByRole("button", { name: "Download" })).not.toBeInTheDocument();
		await user.tab();
		expect(summaryButton).toHaveFocus();
		await user.tab();
		expect(screen.queryByRole("button", { name: "Download", hidden: true })).not.toHaveFocus();

		await user.click(summaryButton);

		expect(summaryButton).toHaveAccessibleName(/view less/i);
		expect(summaryButton).toHaveAttribute("aria-expanded", "true");
		const downloadButton = screen.getByRole("button", { name: "Download" });
		expect(screen.getByText("Aug 1–31, 2026")).toBeVisible();
		expect(screen.getByText("84")).toBeVisible();
		expect(screen.getByText("₦25")).toBeVisible();
		expect(screen.queryByText("Pro plan")).not.toBeInTheDocument();
		await user.tab();
		expect(downloadButton).toHaveFocus();

		await user.click(summaryButton);

		expect(summaryButton).toHaveAccessibleName(/view more/i);
		expect(summaryButton).toHaveAttribute("aria-expanded", "false");
		expect(screen.queryByRole("button", { name: "Download" })).not.toBeInTheDocument();
		await user.tab();
		expect(downloadButton).not.toHaveFocus();
	});
});
