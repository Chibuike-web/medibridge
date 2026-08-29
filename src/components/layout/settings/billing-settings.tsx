import { useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { RiCloseLine } from "@remixicon/react";

import { BillingHistoryCard } from "./billing-history-card";
import type { SettingsSubView } from "./types";

type BillingPlan =
	| {
			kind: "free";
			usedCases: number;
			caseLimit: number;
			trialEnds: string;
	  }
	| {
			kind: "paid";
			usedCases: number;
			caseLimit: number;
	  };

const PRO_MONTHLY_PRICE = "₦20,000 / month";
const PRO_OVERAGE_PRICE = "₦25";
const planToShow = "paid" as BillingPlan["kind"];

const billingPlans = {
	free: { kind: "free", usedCases: 142, caseLimit: 200, trialEnds: "August 28, 2026" },
	paid: { kind: "paid", usedCases: 642, caseLimit: 1000 },
} satisfies Record<BillingPlan["kind"], BillingPlan>;

const activeBillingPlan = billingPlans[planToShow];

export function BillingSettings({
	activeSettingsSubView,
	onSettingsSubViewChange,
}: {
	activeSettingsSubView: SettingsSubView | null;
	onSettingsSubViewChange: (view: SettingsSubView | null) => void;
}) {
	switch (activeSettingsSubView) {
		case "payment-method":
			return <PaymentMethodSettings />;
		case "billing-history":
			return (
				<div className="flex flex-col gap-4 px-6 py-6">
					{[
						{
							amount: "₦22,100",
							date: "Aug 22, 2026",
							cardBrand: "visa" as const,
							cardLastFour: "4242",
							expires: "08/28",
							status: "Paid",
							breakdown: {
								plan: "₦20,000",
								includedCases: "1,000",
								additionalCases: "84",
								overage: "₦2,100",
								total: "₦22,100",
							},
						},
						{
							amount: "₦18,500",
							date: "Jul 22, 2026",
							cardBrand: "mastercard" as const,
							cardLastFour: "5555",
							expires: "11/27",
							status: "Paid",
							breakdown: {
								plan: "₦18,000",
								includedCases: "900",
								additionalCases: "10",
								overage: "₦500",
								total: "₦18,500",
							},
						},
						{
							amount: "₦25,000",
							date: "Jun 22, 2026",
							cardBrand: "verve" as const,
							cardLastFour: "7788",
							expires: "09/27",
							status: "Paid",
							breakdown: {
								plan: "₦20,000",
								includedCases: "1,000",
								additionalCases: "200",
								overage: "₦5,000",
								total: "₦25,000",
							},
						},
						{
							amount: "₦15,000",
							date: "May 22, 2026",
							cardBrand: "mastercard" as const,
							cardLastFour: "9012",
							expires: "04/28",
							status: "Paid",
							breakdown: {
								plan: "₦15,000",
								includedCases: "750",
								additionalCases: "0",
								overage: "₦0",
								total: "₦15,000",
							},
						},
						{
							amount: "₦24,500",
							date: "Apr 22, 2026",
							cardBrand: "verve" as const,
							cardLastFour: "3344",
							expires: "12/27",
							status: "Paid",
							breakdown: {
								plan: "₦20,000",
								includedCases: "1,000",
								additionalCases: "180",
								overage: "₦4,500",
								total: "₦24,500",
							},
						},
						{
							amount: "₦21,750",
							date: "Mar 22, 2026",
							cardBrand: "visa" as const,
							cardLastFour: "2468",
							expires: "06/29",
							status: "Paid",
							breakdown: {
								plan: "₦20,000",
								includedCases: "1,000",
								additionalCases: "70",
								overage: "₦1,750",
								total: "₦21,750",
							},
						},
					].map((billingHistoryEntry) => (
						<BillingHistoryCard key={`${billingHistoryEntry.date}-${billingHistoryEntry.cardLastFour}`} {...billingHistoryEntry} />
					))}
				</div>
			);
		case null:
			return (
				<div className="flex flex-col gap-6 px-6 py-6">
					<BillingPlanCard plan={activeBillingPlan} />
					{planToShow === "paid" ? (
						<PaidBillingDetails onSettingsSubViewChange={onSettingsSubViewChange} />
					) : null}
				</div>
			);
		default:
			return null;
	}
}

function PaymentMethodSettings() {
	const [isChangePaymentMethodOpen, setIsChangePaymentMethodOpen] = useState(false);

	return (
		<>
			<div className="flex min-h-full flex-col gap-6 px-6 py-6">
				<section
					aria-labelledby="current-payment-method-heading"
					className="rounded-2xl border border-gray-200 p-4"
				>
					<h3 id="current-payment-method-heading" className="text-base font-semibold text-gray-800">
						Current payment method
					</h3>
					<div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2">
						<Image src="/assets/visa-logo.svg" width={40} height={13} alt="Visa" />
						<span
							className="text-sm font-medium text-gray-600"
							aria-label="Card ending in 4242"
						>
							******** 4242
						</span>
						<span className="text-sm font-medium text-gray-400">Expires 08/28</span>
					</div>
					<p className="mt-4 text-sm font-medium text-gray-600">
						Used for your Pro subscription and additional case charges.
					</p>
				</section>

				<Button
					type="button"
					className="self-end"
					onClick={() => setIsChangePaymentMethodOpen(true)}
				>
					Change payment method
				</Button>
			</div>

			<Dialog open={isChangePaymentMethodOpen} onOpenChange={setIsChangePaymentMethodOpen}>
				<DialogContent className="max-w-[37.5rem] gap-0 p-0">
					<DialogHeader>
						<DialogTitle className="text-lg">Change payment method</DialogTitle>
						<DialogClose
							className="rounded-md p-1.5 text-foreground/60 transition-colors hover:bg-gray-100 hover:text-foreground"
							aria-label="Close change payment method dialog"
						>
							<RiCloseLine className="size-5" aria-hidden="true" />
						</DialogClose>
					</DialogHeader>
					<DialogDescription className="px-6 py-6 text-sm font-medium text-gray-400">
						You&apos;ll be redirected to Paystack to securely add and authorize your new payment
						method.
					</DialogDescription>
					<DialogFooter className="sm:justify-end">
						<Button
							type="button"

							onClick={() => setIsChangePaymentMethodOpen(false)}
						>
							Continue
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function BillingPlanCard({ plan }: { plan: BillingPlan }) {
	const remainingCases = Math.max(0, plan.caseLimit - plan.usedCases);
	const usagePercent =
		plan.caseLimit > 0 ? Math.min(100, (plan.usedCases / plan.caseLimit) * 100) : 0;

	return (
		<section
			aria-labelledby="current-plan-heading"
			className="rounded-2xl border border-gray-200 p-4"
		>
			<div className="flex items-center justify-between gap-4">
				<h3 id="current-plan-heading" className="text-sm font-medium text-gray-400">
					Current plan
				</h3>
				<span className="rounded-[6px] bg-blue-100 p-[6px] text-[12px] font-semibold text-blue-700 no-line-height">
					{plan.kind === "free" ? "FREE TRIAL" : "PRO"}
				</span>
			</div>
			<p className="mt-2 text-base font-semibold leading-[1.2em] text-gray-800">
				{plan.kind === "free" ? "Free" : PRO_MONTHLY_PRICE}
			</p>
			<div className="mt-3 flex items-center justify-between gap-4 text-sm font-medium text-gray-400">
				<span>
					{plan.usedCases} of {plan.caseLimit.toLocaleString()} cases used
				</span>
				<span className="text-right">{remainingCases} cases remaining</span>
			</div>
			<div
				className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-200"
				role="progressbar"
				aria-label="Plan usage"
				aria-valuemin={0}
				aria-valuemax={plan.caseLimit}
				aria-valuenow={plan.usedCases}
			>
				<div className="h-full rounded-full bg-gray-800" style={{ width: `${usagePercent}%` }} />
			</div>
			{plan.kind === "free" ? (
				<div className="mt-3 flex items-end justify-between gap-4">
					<div>
						<p className="text-sm font-medium text-gray-400">Trial ends</p>
						<p className="mt-1 text-sm font-medium text-gray-600">{plan.trialEnds}</p>
					</div>
					<Button type="button" variant="outline" className="shrink-0 text-gray-600">
						Upgrade to Pro
					</Button>
				</div>
			) : (
				<div className="mt-3">
					<p className="text-sm font-medium text-gray-400">Overage</p>
					<p className="mt-1 text-sm font-medium text-gray-600">
						{PRO_OVERAGE_PRICE} per additional case
					</p>
				</div>
			)}
		</section>
	);
}

function PaidBillingDetails({
	onSettingsSubViewChange,
}: {
	onSettingsSubViewChange: (view: SettingsSubView | null) => void;
}) {
	return (
		<>
			<section aria-labelledby="payment-method-heading">
				<h3 id="payment-method-heading" className="font-semibold text-gray-800 no-line-height">
					Payment method
				</h3>
				<div className="flex h-16 items-center justify-between gap-4 border-b border-gray-200">
					<p className="min-w-0 truncate text-sm font-medium text-gray-600">
						<Image
							src="/assets/visa-logo.svg"
							width={40}
							height={13}
							alt="Visa"
							className="inline-block align-middle"
						/>
						<span aria-hidden="true">••••••</span> <span>4242</span>
					</p>
					<Button
						type="button"
						variant="ghost"
						className="shrink-0 text-gray-400"
						onClick={() => onSettingsSubViewChange("payment-method")}
					>
						Manage
					</Button>
				</div>
			</section>

			<section aria-labelledby="billing-history-heading">
				<h3 id="billing-history-heading" className="font-semibold text-gray-800 no-line-height">
					Billing history
				</h3>
				<div className="flex h-16 items-center justify-between gap-4 border-b border-gray-200">
					<p className="text-sm font-medium text-gray-600">10 invoices</p>
					<Button
						type="button"
						variant="ghost"
						className="shrink-0 text-gray-400"
						onClick={() => onSettingsSubViewChange("billing-history")}
					>
						View
					</Button>
				</div>
			</section>

			<section
				aria-labelledby="cancel-plan-heading"
				className="flex items-center justify-between gap-12 pt-2"
			>
				<div className="min-w-0">
					<h3 id="cancel-plan-heading" className="font-semibold text-gray-800">
						Cancel plan
					</h3>
					<p className="mt-1 max-w-md text-sm text-gray-600 text-pretty">
						If you cancel, you&apos;ll keep full access to your plan features until the end of your
						billing period.
					</p>
				</div>
				<Button
					type="button"
					variant="destructive"
					className="shrink-0 border border-destructive bg-transparent text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:bg-transparent dark:hover:bg-destructive/10 dark:focus-visible:ring-destructive/40"
				>
					Cancel
				</Button>
			</section>
		</>
	);
}
